import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdateSystemParametersDto } from './update-system-parameters.dto';

export { UpdateSystemParametersDto };

/** Margem interna da etiqueta, em mm — igual de cada lado. Espelha o CSS de
 *  impressão do portal; é o que sobra à volta do QR e faz de zona silenciosa. */
const LABEL_PADDING_MM = 2;
/** Largura mínima reservada ao código amigável, ao lado do QR. */
const LABEL_CODE_WIDTH_MM = 10;

@Injectable()
export class UpdateSystemParametersUseCase
  implements IUseCase<UpdateSystemParametersDto, SystemParameter>
{
  constructor(
    @Inject(DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY)
    private readonly systemParameterRepository: ISystemParameterRepository,
  ) { }

  async call(param: UpdateSystemParametersDto): Promise<SystemParameter> {
    this.assertQrFitsLabel(param);

    const existing = await this.systemParameterRepository.getSingleton();
    if (!existing) {
      return this.systemParameterRepository.create({
        collectionConfirmationDeadlineDays:
          param.collectionConfirmationDeadlineDays,
        qrCodeThresholdPercentage: param.qrCodeThresholdPercentage,
        labelWidthMm: param.labelWidthMm,
        labelHeightMm: param.labelHeightMm,
        labelQrSizeMm: param.labelQrSizeMm,
      });
    }

    const [updated] = await this.systemParameterRepository.update(
      { id: existing.id },
      {
        collectionConfirmationDeadlineDays:
          param.collectionConfirmationDeadlineDays,
        qrCodeThresholdPercentage: param.qrCodeThresholdPercentage,
        labelWidthMm: param.labelWidthMm,
        labelHeightMm: param.labelHeightMm,
        labelQrSizeMm: param.labelQrSizeMm,
      },
    );
    return updated;
  }

  /**
   * Os três valores só fazem sentido uns em relação aos outros, por isso a
   * regra não cabe no DTO. Sem isto, gravar um QR maior do que a etiqueta dava
   * uma folha de etiquetas cortadas — e só se descobria depois de imprimir.
   */
  private assertQrFitsLabel(param: UpdateSystemParametersDto): void {
    const usableHeight = param.labelHeightMm - 2 * LABEL_PADDING_MM;
    const usableWidth =
      param.labelWidthMm - 2 * LABEL_PADDING_MM - LABEL_CODE_WIDTH_MM;

    if (param.labelQrSizeMm > usableHeight || param.labelQrSizeMm > usableWidth) {
      throw new BadRequestException('errors.systemParameter.qrLargerThanLabel');
    }
  }
}
