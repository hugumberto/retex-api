import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import {
  generateBatchId,
  generateFriendlyCode,
  generateToken,
} from '../bag.util';

const MAX_COLLISION_RETRIES = 5;

export interface GenerateCollectionBagsParams {
  routeId: string;
  quantity: number;
}

/**
 * Gera `quantity` QR codes vinculados a uma rota (pool da rota): `routeId`
 * preenchido, `collectionRequestId` nulo, `usedAt` nulo. Todos partilham o mesmo `batchId`.
 * Usado na entrada da rota em IN_TRANSIT. Reutiliza o util de token/friendlyCode
 * e a retentativa por colisão de friendlyCode.
 */
@Injectable()
export class GenerateCollectionBagsUseCase
  implements IUseCase<GenerateCollectionBagsParams, CollectionRequestBag[]>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) {}

  async call(param: GenerateCollectionBagsParams): Promise<CollectionRequestBag[]> {
    const year = new Date().getFullYear();
    const batchId = generateBatchId();
    const usedInBatch = new Set<string>();
    const created: CollectionRequestBag[] = [];

    for (let i = 0; i < param.quantity; i++) {
      const friendlyCode = await this.generateUniqueFriendlyCode(
        year,
        usedInBatch,
      );
      usedInBatch.add(friendlyCode);

      const bag = await this.collectionRequestBagRepository.create({
        token: generateToken(),
        friendlyCode,
        batchId,
        routeId: param.routeId,
      });
      created.push(bag);
    }

    return created;
  }

  /**
   * Gera um friendlyCode único (não usado no lote nem persistido). Tenta o
   * formato padrão; se esgotar as retentativas, cai para um fallback com
   * entropia extra (evita abortar o lote por uma colisão rara). O erro
   * explícito é apenas a salvaguarda final, que na prática nunca dispara.
   */
  private async generateUniqueFriendlyCode(
    year: number,
    usedInBatch: Set<string>,
  ): Promise<string> {
    const isFree = async (code: string) =>
      !usedInBatch.has(code) &&
      !(await this.collectionRequestBagRepository.findOne({ friendlyCode: code }));

    for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
      const code = generateFriendlyCode(year);
      if (await isFree(code)) return code;
    }

    // Fallback: sufixo aleatório (mais entropia), ainda verificando unicidade.
    for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
      const code = `${generateFriendlyCode(year)}${randomBytes(2)
        .toString('hex')
        .toUpperCase()}`;
      if (await isFree(code)) return code;
    }

    throw new ConflictException(
      'Não foi possível gerar um código único para o QR code',
    );
  }
}
