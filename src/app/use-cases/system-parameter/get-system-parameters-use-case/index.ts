import { Inject, Injectable } from '@nestjs/common';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

const DEFAULT_CONFIRMATION_DEADLINE_DAYS = 2;
const DEFAULT_QR_CODE_THRESHOLD_PERCENTAGE = 10;

@Injectable()
export class GetSystemParametersUseCase implements IUseCase<void, SystemParameter> {
  constructor(
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
  ) { }

  async call(): Promise<SystemParameter> {
    const existing = await this.systemParameterRepository.getSingleton();
    if (existing) {
      return existing;
    }
    // Cria a linha default na primeira leitura, caso a seed/migração não a tenha criado.
    return this.systemParameterRepository.create({
      collectionConfirmationDeadlineDays: DEFAULT_CONFIRMATION_DEADLINE_DAYS,
      qrCodeThresholdPercentage: DEFAULT_QR_CODE_THRESHOLD_PERCENTAGE,
    });
  }
}
