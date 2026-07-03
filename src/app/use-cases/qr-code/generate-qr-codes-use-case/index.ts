import { Inject, Injectable } from '@nestjs/common';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import {
  generateBatchId,
  generateFriendlyCode,
  generateToken,
} from '../qr-code.util';
import { GenerateQrCodesDto } from './generate-qr-codes.dto';

export { GenerateQrCodesDto };

// Códigos não utilizados expiram após 24h.
const UNUSED_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_COLLISION_RETRIES = 5;

@Injectable()
export class GenerateQrCodesUseCase implements IUseCase<GenerateQrCodesDto, QrCode[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) { }

  async call(param: GenerateQrCodesDto): Promise<QrCode[]> {
    // Limpeza preguiçosa: remove os não utilizados com mais de 24h.
    await this.qrCodeRepository.deleteExpiredUnused(
      new Date(Date.now() - UNUSED_TTL_MS),
    );

    const year = new Date().getFullYear();
    const batchId = generateBatchId();
    const usedInBatch = new Set<string>();
    const created: QrCode[] = [];

    for (let i = 0; i < param.quantity; i++) {
      let friendlyCode = generateFriendlyCode(year);
      let attempts = 0;
      while (
        attempts < MAX_COLLISION_RETRIES &&
        (usedInBatch.has(friendlyCode) ||
          (await this.qrCodeRepository.findOne({ friendlyCode })))
      ) {
        friendlyCode = generateFriendlyCode(year);
        attempts++;
      }
      usedInBatch.add(friendlyCode);

      const qrCode = await this.qrCodeRepository.create({
        token: generateToken(),
        friendlyCode,
        batchId,
      });
      created.push(qrCode);
    }

    return created;
  }
}
