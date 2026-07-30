import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { IUnitOfWork } from '../../../../domain/interfaces/unit-of-work.interface';
import {
  CollectionRequest,
  CollectionRequestStatus,
} from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { generateFriendlyCode } from '../../collection-request-bag/bag.util';
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
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) {}

  async call(param: CreateCollectionRequestDto): Promise<CollectionRequest> {
    const user = await this.userRepository.findOne({ id: param.userId });
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }

    const address = await this.addressRepository.findOne({
      id: param.addressId,
    });
    if (!address || address.userId !== param.userId) {
      throw new NotFoundException('errors.address.notFound');
    }

    const friendlyCode = await this.generateUniqueFriendlyCode();

    const pkg = await this.unitOfWork.runInTransaction(async () => {
      const sanitizedCity = this.sanitizationService.sanitizeString(
        address.city,
      );
      const testZone = await this.testZoneRepository.findByCity(sanitizedCity);
      const collectionRequestStatus = testZone
        ? CollectionRequestStatus.CREATED
        : CollectionRequestStatus.OUT_OF_ZONE;

      const collectionRequestDto: Partial<CollectionRequest> = {
        status: collectionRequestStatus,
        friendlyCode,
        user: user,
        address: address,
        estimatedBags: param.estimatedBags,
      };

      return this.collectionRequestRepository.create(collectionRequestDto);
    });

    this.sendConfirmationEmail(user, address, pkg).catch((err) =>
      this.logger.error(
        `Falha ao enviar email de confirmação para ${user.email}: ${err.message}`,
      ),
    );

    return pkg;
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
  private async generateUniqueFriendlyCode(): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateFriendlyCode(year);
      const existing = await this.collectionRequestRepository.findOne({
        friendlyCode: code,
      } as Partial<CollectionRequest>);
      if (!existing) return code;
    }
    // Fallback improvável: sufixo extra para reduzir a chance de colisão.
    return `${generateFriendlyCode(year)}${Date.now().toString(36).slice(-2).toUpperCase()}`;
  }

}
