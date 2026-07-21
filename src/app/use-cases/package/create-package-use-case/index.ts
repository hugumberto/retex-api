import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { IUnitOfWork } from '../../../../domain/interfaces/unit-of-work.interface';
import {
  Package,
  PackageStatus,
} from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { generateFriendlyCode } from '../../qr-code/qr-code.util';
import { CreatePackageDto } from './create-package.dto';

@Injectable()
export class CreatePackageUseCase
  implements IUseCase<CreatePackageDto, Package>
{
  private readonly logger = new Logger(CreatePackageUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
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

  async call(param: CreatePackageDto): Promise<Package> {
    const user = await this.userRepository.findOne({ id: param.userId });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    const address = await this.addressRepository.findOne({
      id: param.addressId,
    });
    if (!address || address.userId !== param.userId) {
      throw new NotFoundException('Endereço não encontrado');
    }

    const friendlyCode = await this.generateUniqueFriendlyCode();

    const pkg = await this.unitOfWork.runInTransaction(async () => {
      const sanitizedCity = this.sanitizationService.sanitizeString(
        address.city,
      );
      const testZone = await this.testZoneRepository.findByCity(sanitizedCity);
      const packageStatus = testZone
        ? PackageStatus.CREATED
        : PackageStatus.OUT_OF_ZONE;

      const packageDto: Partial<Package> = {
        status: packageStatus,
        friendlyCode,
        user: user,
        address: address,
        estimatedVolumes: param.estimatedVolumes,
      };

      return this.packageRepository.create(packageDto);
    });

    this.sendConfirmationEmail(user, address, pkg).catch((err) =>
      this.logger.error(
        `Falha ao enviar email de confirmação para ${user.email}: ${err.message}`,
      ),
    );

    return pkg;
  }

  private async sendConfirmationEmail(
    user: { id: string; firstName: string; lastName: string; email: string },
    address: { street: string; number: string; city: string; zipCode: string },
    pkg: Package,
  ): Promise<void> {
    await this.emailService.send({
      to: user.email,
      subject: 'O seu pacote foi registado!',
      template: 'package-confirmation',
      context: {
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        packageId: pkg.id,
        friendlyCode: pkg.friendlyCode,
        status: this.formatStatus(pkg.status),
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
      const existing = await this.packageRepository.findOne({
        friendlyCode: code,
      } as Partial<Package>);
      if (!existing) return code;
    }
    // Fallback improvável: sufixo extra para reduzir a chance de colisão.
    return `${generateFriendlyCode(year)}${Date.now().toString(36).slice(-2).toUpperCase()}`;
  }

  private formatStatus(status: PackageStatus): string {
    const labels: Record<PackageStatus, string> = {
      [PackageStatus.CREATED]: 'Criado',
      [PackageStatus.CONFIRMED]: 'Confirmado',
      [PackageStatus.OUT_OF_ZONE]: 'Fora de zona',
      [PackageStatus.WAITING_FOR_COLLECTION]: 'A aguardar recolha',
      [PackageStatus.COLLECTED]: 'Recolhido',
      [PackageStatus.IN_TRANSIT]: 'Em trânsito',
      [PackageStatus.IN_HOUSE]: 'Em armazém',
      [PackageStatus.CANCELLED]: 'Cancelado',
      [PackageStatus.SCREENING]: 'Em triagem',
      [PackageStatus.STOCKED]: 'Armazenado',
    };
    return labels[status] ?? status;
  }
}
