import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { ConfirmCollectionDto } from './confirm-collection.dto';

export { ConfirmCollectionDto };

const DEFAULT_CONFIRMATION_DEADLINE_DAYS = 2;

@Injectable()
export class ConfirmCollectionUseCase implements IUseCase<ConfirmCollectionDto, Package> {
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
  ) { }

  async call(param: ConfirmCollectionDto): Promise<Package> {
    const pkg = await this.packageRepository.findByCollectionConfirmationToken(
      param.token,
    );
    if (!pkg) {
      throw new NotFoundException('Token de confirmação inválido');
    }

    if (pkg.route?.startDate) {
      const days = await this.getDeadlineDays();
      if (this.isPastDeadline(pkg.route.startDate, days)) {
        throw new BadRequestException(
          'O prazo para confirmar a recolha já expirou',
        );
      }
    }

    const [updated] = await this.packageRepository.update(
      { id: pkg.id },
      { collectionConfirmedAt: new Date(), collectionConfirmationToken: null },
    );
    return updated;
  }

  private async getDeadlineDays(): Promise<number> {
    const params = await this.systemParameterRepository.getSingleton();
    return (
      params?.collectionConfirmationDeadlineDays ??
      DEFAULT_CONFIRMATION_DEADLINE_DAYS
    );
  }

  // Verdadeiro se hoje já passou do dia-limite (startDate - days).
  private isPastDeadline(startDate: Date, days: number): boolean {
    const start = new Date(startDate);
    const deadline = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() - days,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime() > deadline.getTime();
  }
}
