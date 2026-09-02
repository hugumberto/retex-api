import { Inject, Injectable } from '@nestjs/common';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import {
  generateBatchId,
  generateToken,
  generateUniqueFriendlyCode,
} from '../bag.util';

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
      const friendlyCode = await generateUniqueFriendlyCode(year, (code) =>
        this.isFriendlyCodeTaken(code, usedInBatch),
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

  /** Ocupado se já saiu neste lote ou se já existe em BD. */
  private async isFriendlyCodeTaken(
    code: string,
    usedInBatch: Set<string>,
  ): Promise<boolean> {
    if (usedInBatch.has(code)) return true;
    return !!(await this.collectionRequestBagRepository.findOne({
      friendlyCode: code,
    }));
  }
}
