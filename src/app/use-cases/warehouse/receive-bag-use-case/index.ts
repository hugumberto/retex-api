import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CollectionRequest,
  CollectionRequestStatus,
} from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { normalizeFriendlyCode } from '../../shared/identifier.util';
import { ReceiveBagDto } from './receive-bag.dto';

export { ReceiveBagDto };

// Só entra no armazém o que foi recolhido; um pedido já em triagem também pode
// ter sacos que chegaram depois.
const RECEIVABLE = [
  CollectionRequestStatus.COLLECTED,
  CollectionRequestStatus.IN_HOUSE,
  CollectionRequestStatus.SCREENING,
];

export type ReceiveBagResult = {
  collectionRequestId: string;
  code: string | null;
  bagsReceivedNow: number;
  bagsReceived: number;
  bagsLinked: number;
  status: CollectionRequestStatus;
};

/**
 * Entrada de sacos no armazém. Com o código de um saco, regista esse saco; com
 * o código do pedido, regista de uma vez os sacos do pedido que ainda não
 * entraram e reparte o peso por eles. Quando todos os sacos do pedido entram,
 * o pedido recolhido passa a "Em armazém" (IN_HOUSE), pronto para a triagem.
 */
@Injectable()
export class ReceiveBagUseCase implements IUseCase<ReceiveBagDto, ReceiveBagResult> {
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly bagRepository: ICollectionRequestBagRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) {}

  async call({ code, weight }: ReceiveBagDto): Promise<ReceiveBagResult> {
    const value = code.trim();
    const friendly = normalizeFriendlyCode(value);

    // Por ordem: token do QR (tal como vem), código do saco, código do pedido.
    const bag =
      (await this.bagRepository.findOne({ token: value })) ??
      (await this.bagRepository.findOne({ friendlyCode: friendly }));

    let request: CollectionRequest | null = null;
    let targets: CollectionRequestBag[];
    if (bag) {
      if (!bag.collectionRequestId) {
        throw new BadRequestException('errors.reception.bagNotLinked');
      }
      if (bag.receivedAt) {
        throw new ConflictException('errors.reception.alreadyReceived');
      }
      request = await this.collectionRequestRepository.findOne({ id: bag.collectionRequestId });
      targets = [bag];
    } else {
      request = await this.collectionRequestRepository.findOne({
        friendlyCode: friendly,
      } as Partial<CollectionRequest>);
      if (!request) {
        throw new NotFoundException('errors.reception.notFound');
      }
      const bags = await this.bagRepository.find({ collectionRequestId: request.id });
      if (bags.length === 0) {
        throw new BadRequestException('errors.reception.noBags');
      }
      targets = bags.filter((b) => !b.receivedAt);
      if (targets.length === 0) {
        throw new ConflictException('errors.reception.alreadyReceived');
      }
    }

    if (!request) {
      throw new NotFoundException('errors.collection.requestNotFound');
    }
    if (!RECEIVABLE.includes(request.status)) {
      throw new BadRequestException('errors.reception.notCollected');
    }

    // Repartir em cêntimos de kg, para a soma dar exatamente o peso lido.
    const totalCents = Math.round(weight * 100);
    const share = Math.floor(totalCents / targets.length);
    const receivedAt = new Date();
    for (const [index, target] of targets.entries()) {
      const cents = index === 0 ? totalCents - share * (targets.length - 1) : share;
      await this.bagRepository.update(
        { id: target.id },
        { receivedAt, receivedWeight: cents / 100 },
      );
    }

    const all = await this.bagRepository.find({ collectionRequestId: request.id });
    const received = all.filter((b) => b.receivedAt || targets.some((t) => t.id === b.id)).length;

    let status = request.status;
    if (received === all.length && status === CollectionRequestStatus.COLLECTED) {
      status = CollectionRequestStatus.IN_HOUSE;
      await this.collectionRequestRepository.update({ id: request.id }, { status });
    }

    return {
      collectionRequestId: request.id,
      code: request.friendlyCode ?? null,
      bagsReceivedNow: targets.length,
      bagsReceived: received,
      bagsLinked: all.length,
      status,
    };
  }
}
