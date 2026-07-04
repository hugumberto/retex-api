import { Inject, Injectable } from '@nestjs/common';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdateSystemParametersDto } from './update-system-parameters.dto';

export { UpdateSystemParametersDto };

@Injectable()
export class UpdateSystemParametersUseCase
  implements IUseCase<UpdateSystemParametersDto, SystemParameter>
{
  constructor(
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
  ) { }

  async call(param: UpdateSystemParametersDto): Promise<SystemParameter> {
    const existing = await this.systemParameterRepository.getSingleton();
    if (!existing) {
      return this.systemParameterRepository.create({
        collectionConfirmationDeadlineDays:
          param.collectionConfirmationDeadlineDays,
      });
    }

    const [updated] = await this.systemParameterRepository.update(
      { id: existing.id },
      {
        collectionConfirmationDeadlineDays:
          param.collectionConfirmationDeadlineDays,
      },
    );
    return updated;
  }
}
