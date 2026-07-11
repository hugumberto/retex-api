import { Inject, Injectable } from '@nestjs/common';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

/**
 * Lista os QR codes gerados para uma rota (para impressão).
 */
@Injectable()
export class GetRouteQrCodesUseCase implements IUseCase<string, QrCode[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) {}

  async call(routeId: string): Promise<QrCode[]> {
    return this.qrCodeRepository.findByRoute(routeId);
  }
}
