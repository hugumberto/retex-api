import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { IUnitOfWork } from '../../../../domain/interfaces/unit-of-work.interface';
import {
  CollectionRequest,
  CollectionRequestStatus,
} from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { UserType } from '../../../../domain/user/user-type.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { generateUniqueFriendlyCode } from '../../shared/friendly-code.util';
import { CreateCollectionRequestDto } from './create-collection-request.dto';

@Injectable()
export class CreateCollectionRequestUseCase
  implements IUseCase<CreateCollectionRequestDto, CollectionRequest>
{
  private readonly logger = new Logger(CreateCollectionRequestUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
    @Inject(DOMAIN_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    private readonly companyContextService: CompanyContextService,
  ) {}

  async call(param: CreateCollectionRequestDto): Promise<CollectionRequest> {
    const friendlyCode = await this.generateUniqueFriendlyCode();

    // Resolver o cliente dentro da transação: na forma de balcão isto cria
    // utilizador e morada, e um erro mais à frente não pode deixar um cliente
    // sem solicitação nenhuma na base.
    const { pkg, user, address } = await this.unitOfWork.runInTransaction(
      async () => {
        const { user, address, companyContext } = param.address
          ? await this.resolveWalkInClient(param)
          : await this.resolveExistingClient(param);

        const sanitizedCity = this.sanitizationService.sanitizeString(
          address.city,
        );
        const testZone =
          await this.testZoneRepository.findByCity(sanitizedCity);
        const collectionRequestStatus = testZone
          ? CollectionRequestStatus.CREATED
          : CollectionRequestStatus.OUT_OF_ZONE;

        const collectionRequestDto: Partial<CollectionRequest> = {
          status: collectionRequestStatus,
          friendlyCode,
          user: user,
          // NULL para particulares. É o sinal que distingue empresa de
          // particular na listagem e na construção de rotas.
          companyId: companyContext?.companyId ?? null,
          address: address,
          estimatedBags: param.estimatedBags,
        };

        const pkg =
          await this.collectionRequestRepository.create(collectionRequestDto);

        return { pkg, user, address };
      },
    );

    this.sendConfirmationEmail(user, address, pkg).catch((err) =>
      this.logger.error(
        `Falha ao enviar email de confirmação para ${user.email}: ${err.message}`,
      ),
    );

    return pkg;
  }

  /** Cliente que já existe: o pedido traz os ids e só é preciso validá-los. */
  private async resolveExistingClient(param: CreateCollectionRequestDto) {
    const user = await this.userRepository.findOne({ id: param.userId });
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }

    // Empresa do requerente, quando é membro de uma. Resolvida da BD e não do
    // JWT, para que perder o acesso à empresa tenha efeito imediato.
    const companyContext = await this.companyContextService.resolve(
      param.userId,
    );

    const address = await this.addressRepository.findOne({
      id: param.addressId,
    });

    // A morada tem de ser do próprio ou da empresa a que pertence — é o que
    // permite a um colaborador pedir recolha num local da empresa.
    const ownsAddress = address?.userId === param.userId;
    const companyOwnsAddress =
      !!companyContext &&
      !!address?.companyId &&
      address.companyId === companyContext.companyId;

    if (!address || (!ownsAddress && !companyOwnsAddress)) {
      throw new NotFoundException('errors.address.notFound');
    }

    return { user, address, companyContext };
  }

  /**
   * Cliente ao balcão: o operador tem a pessoa ao telefone e escreve os dados.
   *
   * O email identifica o cliente — se já existir, reutiliza-se em vez de
   * recusar, porque o operador não tem como saber se a pessoa já está
   * registada (a listagem de utilizadores é só de ADMIN). A morada é
   * reaproveitada quando coincide, para não encher o registo de duplicados a
   * cada recolha da mesma casa.
   *
   * Ao contrário do registo público, não é enviado email de ativação: quem foi
   * inscrito ao telefone não está à espera de nenhum.
   */
  private async resolveWalkInClient(param: CreateCollectionRequestDto) {
    const email = param.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ email });

    const user = existing ?? (await this.createWalkInUser(param, email));
    const address = await this.resolveWalkInAddress(param, user.id);

    // Cliente criado ao balcão é sempre particular: um membro de empresa chega
    // por outro caminho, com os seus ids.
    return { user, address, companyContext: null };
  }

  private async createWalkInUser(
    param: CreateCollectionRequestDto,
    email: string,
  ) {
    // Password aleatória que ninguém conhece: a conta nasce sem acesso e só
    // passa a tê-lo por recuperação de password ou ativação, mais tarde.
    const hashedPassword = await this.cryptoService.hashPassword(
      randomBytes(32).toString('hex'),
    );

    const user = await this.userRepository.create({
      firstName: param.firstName,
      lastName: param.lastName,
      email,
      contactPhone: param.contactPhone ?? '',
      password: hashedPassword,
      status: UserStatus.INACTIVE,
      userType: UserType.PERSON,
    });

    await this.userRoleRepository.create({
      user: user as User,
      role: Role.USER,
    });

    return user;
  }

  private async resolveWalkInAddress(
    param: CreateCollectionRequestDto,
    userId: string,
  ) {
    const sanitizedCity = this.sanitizationService.sanitizeString(
      param.address.city ?? '',
    );
    const zipCode = this.sanitizationService.sanitizeNumericString(
      param.address.zipCode,
    );
    const number = param.address.number ?? '';

    const existing = await this.addressRepository.findByUser(userId);
    const match = existing.find(
      (candidate) =>
        candidate.zipCode === zipCode &&
        candidate.street === param.address.street &&
        candidate.number === number,
    );
    if (match) {
      return match;
    }

    const testZone = await this.testZoneRepository.findByCity(sanitizedCity);

    return this.addressRepository.create({
      userId,
      street: param.address.street,
      number,
      complement: param.address.complement,
      city: param.address.city ?? '',
      cityNormalized: sanitizedCity,
      cityDivision: param.address.cityDivision ?? '',
      country: param.address.country ?? '',
      countryDivision: param.address.countryDivision ?? '',
      zipCode,
      lat: this.sanitizationService.sanitizeCoordinate(
        param.address.lat ?? '0',
      ),
      long: this.sanitizationService.sanitizeCoordinate(
        param.address.long ?? '0',
      ),
      isDefault: existing.length === 0,
      isInServiceZone: !!testZone,
    });
  }

  private async sendConfirmationEmail(
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      language?: string;
    },
    address: { street: string; number: string; city: string; zipCode: string },
    pkg: CollectionRequest,
  ): Promise<void> {
    await this.emailService.send({
      to: user.email,
      template: 'package-confirmation',
      locale: user.language,
      context: {
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        collectionRequestId: pkg.id,
        friendlyCode: pkg.friendlyCode,
        // O template resolve a etiqueta do estado com `{{t statusKey}}`, para
        // que ela saia no idioma do destinatário.
        statusKey: `status.${pkg.status}`,
        address,
        year: new Date().getFullYear(),
      },
      meta: { type: 'package-confirmation', userId: user.id },
    });
  }

  /**
   * Gera um código amigável (`ano-XXXXXX`) garantindo unicidade contra os já
   * existentes. O índice único na coluna é a rede de segurança final.
   */
  private generateUniqueFriendlyCode(): Promise<string> {
    return generateUniqueFriendlyCode((friendlyCode) =>
      this.collectionRequestRepository.findOne({
        friendlyCode,
      } as Partial<CollectionRequest>),
    );
  }

}
