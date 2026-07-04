import { Inject, Injectable } from '@nestjs/common';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface ProcessCollectionSchedulesResult {
  removedFromRoute: number;
  movedToWaiting: number;
}

const DEFAULT_CONFIRMATION_DEADLINE_DAYS = 2;

/**
 * Executado diariamente pelo scheduler:
 *  - remove da rota as solicitações não confirmadas cujo prazo já passou;
 *  - move para WAITING_FOR_COLLECTION as confirmadas cujo dia da coleta chegou.
 */
@Injectable()
export class ProcessCollectionSchedulesUseCase
  implements IUseCase<void, ProcessCollectionSchedulesResult>
{
  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
  ) { }

  async call(): Promise<ProcessCollectionSchedulesResult> {
    const params = await this.systemParameterRepository.getSingleton();
    const days =
      params?.collectionConfirmationDeadlineDays ??
      DEFAULT_CONFIRMATION_DEADLINE_DAYS;

    // 1. Prazo expirado sem confirmação → sai da rota e volta a ficar elegível.
    const expired = await this.packageRepository.findExpiredUnconfirmed(days);
    for (const pkg of expired) {
      await this.packageRepository.update(
        { id: pkg.id },
        { route: null, collectionConfirmationToken: null },
      );
    }

    // 2. Dia da coleta chegou (confirmadas) → aguardando recolha.
    const due = await this.packageRepository.findDueConfirmed();
    for (const pkg of due) {
      await this.packageRepository.update(
        { id: pkg.id },
        { status: PackageStatus.WAITING_FOR_COLLECTION },
      );
    }

    return {
      removedFromRoute: expired.length,
      movedToWaiting: due.length,
    };
  }
}
