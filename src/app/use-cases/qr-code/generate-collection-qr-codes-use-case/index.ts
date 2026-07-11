import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import {
  generateBatchId,
  generateFriendlyCode,
  generateToken,
} from '../qr-code.util';

const MAX_COLLISION_RETRIES = 5;

export interface GenerateCollectionQrCodesParams {
  routeId: string;
  quantity: number;
}

/**
 * Gera `quantity` QR codes vinculados a uma rota (pool da rota): `routeId`
 * preenchido, `packageId` nulo, `usedAt` nulo. Todos partilham o mesmo `batchId`.
 * Usado na entrada da rota em IN_TRANSIT. Reutiliza o util de token/friendlyCode
 * e a retentativa por colisão de friendlyCode.
 */
@Injectable()
export class GenerateCollectionQrCodesUseCase
  implements IUseCase<GenerateCollectionQrCodesParams, QrCode[]>
{
  constructor(
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) {}

  async call(param: GenerateCollectionQrCodesParams): Promise<QrCode[]> {
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
      // Falha explícita em vez de violar o índice único de friendly_code.
      if (
        usedInBatch.has(friendlyCode) ||
        (await this.qrCodeRepository.findOne({ friendlyCode }))
      ) {
        throw new ConflictException(
          'Não foi possível gerar um código único para o QR code',
        );
      }
      usedInBatch.add(friendlyCode);

      const qrCode = await this.qrCodeRepository.create({
        token: generateToken(),
        friendlyCode,
        batchId,
        routeId: param.routeId,
      });
      created.push(qrCode);
    }

    return created;
  }
}
