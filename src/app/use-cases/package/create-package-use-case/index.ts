import { Inject, Injectable, Logger } from "@nestjs/common";
import { IUnitOfWork } from "../../../../domain/interfaces/unit-of-work.interface";
import { Package, PackageStatus } from "../../../../domain/package/package.entity";
import { IPackageRepository } from "../../../../domain/package/package.repository";
import { ITestZoneRepository } from "../../../../domain/test-zone/test-zone.repository";
import { DOMAIN_TOKENS } from "../../../../domain/tokens";
import { IEmailService } from "../../../services/interfaces/email.interface";
import { ISanitizationService } from "../../../services/interfaces/sanitization.interface";
import { SERVICE_TOKENS } from "../../../services/tokens";
import { IUseCase } from "../../interfaces/use-case.interface";
import { CreateUserUseCase } from "../../user/create-user-use-case";
import { CreateUserDto } from "../../user/create-user-use-case/create-user.dto";
import { CreatePackageDto } from "./create-package.dto";

@Injectable()
export class CreatePackageUseCase implements IUseCase<CreatePackageDto, Package> {
  private readonly logger = new Logger(CreatePackageUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
    @Inject(DOMAIN_TOKENS.UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    private readonly createUserUseCase: CreateUserUseCase
  ) { }

  async call(param: CreatePackageDto): Promise<Package> {
    const pkg = await this.unitOfWork.runInTransaction(async () => {
      const user = await this.createUserUseCase.call(this.createUserDto(param))

      const sanitizedCity = this.sanitizationService.sanitizeString(param.address.city);
      const testZone = await this.testZoneRepository.findByCity(sanitizedCity);

      const packageStatus = testZone ? PackageStatus.CREATED : PackageStatus.OUT_OF_ZONE

      const packageDto: Partial<Package> = {
        status: packageStatus,
        user: user,
        collectDay: param.dayOfWeek,
        collectTime: param.timeOfDay,
        address: {
          ...param.address,
          city: param.address.city,
          zipCode: this.sanitizationService.sanitizeNumericString(param.address.zipCode),
          lat: this.sanitizationService.sanitizeCoordinate(param.address.lat),
          long: this.sanitizationService.sanitizeCoordinate(param.address.long),
        },
      }

      return this.packageRepository.create(packageDto)
    });

    this.sendConfirmationEmail(param, pkg).catch((err) =>
      this.logger.error(`Falha ao enviar email de confirmação para ${param.email}: ${err.message}`),
    );

    return pkg;
  }

  private async sendConfirmationEmail(param: CreatePackageDto, pkg: Package): Promise<void> {
    await this.emailService.send({
      to: param.email,
      subject: 'Seu pacote foi cadastrado!',
      template: 'package-confirmation',
      context: {
        firstName: param.firstName,
        lastName: param.lastName,
        status: pkg.status,
        address: pkg.address,
        collectDay: pkg.collectDay,
        collectTime: pkg.collectTime,
        year: new Date().getFullYear(),
      },
    });
  }

  private createUserDto(packageDto: CreatePackageDto): CreateUserDto {
    const dto: CreateUserDto = {
      firstName: packageDto.firstName,
      lastName: packageDto.lastName,
      email: packageDto.email,
      contactPhone: packageDto.contactPhone,
      documentNumber: packageDto.nif,
      password: packageDto.nif,
    };

    return dto;
  }
}