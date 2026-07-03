import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { MarkQrCodeUsedDto } from './mark-qr-code-used.dto';

export { MarkQrCodeUsedDto };

@Injectable()
export class MarkQrCodeUsedUseCase implements IUseCase<MarkQrCodeUsedDto, QrCode> {
  constructor(
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) { }

  async call(param: MarkQrCodeUsedDto): Promise<QrCode> {
    const qrCode = await this.qrCodeRepository.findOne({ token: param.token });
    if (!qrCode) {
      throw new NotFoundException('QR code não encontrado');
    }

    // Idempotente: se já está marcado como utilizado, não faz nada.
    if (qrCode.usedAt) {
      return qrCode;
    }

    const [updated] = await this.qrCodeRepository.update(
      { id: qrCode.id },
      { usedAt: new Date() },
    );
    return updated;
  }
}
