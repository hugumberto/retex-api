import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { CATEGORY_PART } from '../../../../domain/item/item-category';
import { Destination, Item, Type, isReusableDestination } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { StorageSlot, resolveStorageSlot } from '../../../../domain/storage-unit/storage-slot';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateItemDto } from './create-item.dto';

export interface CreateItemParams extends CreateItemDto {
  // Utilizador autenticado que regista o item (operador da triagem).
  operatorId?: string;
}

export interface CreateItemResult extends Item {
  // Lote físico onde a peça deve ser colocada (null = não vai para lote).
  storageSlot: StorageSlot | null;
}

@Injectable()
export class CreateItemUseCase implements IUseCase<CreateItemParams, CreateItemResult> {
  constructor(
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY)
    private readonly collectionRequestBagRepository: ICollectionRequestBagRepository,
  ) { }

  async call(param: CreateItemParams): Promise<CreateItemResult> {
    // Validar se o package existe
    const collectionRequestEntity = await this.collectionRequestRepository.findOne({ id: param.collectionRequestId });
    if (!collectionRequestEntity) {
      throw new BadRequestException('errors.collectionRequest.notFound');
    }

    // Validar se a brand existe (obrigatória só para destinos reutilizáveis)
    let brand: Brand | null = null;
    if (param.brandId) {
      brand = await this.brandRepository.findOne({ id: param.brandId });
      if (!brand) {
        throw new BadRequestException('errors.brand.notFound');
      }
    }

    // Validar o volume (QR code) quando informado (triagem por volume)
    let bag = null;
    if (param.bagId) {
      bag = await this.collectionRequestBagRepository.findOne({ id: param.bagId });
      if (!bag) {
        throw new BadRequestException('errors.qrCode.notFound');
      }
    }

    const destination = param.destination ?? Destination.REUSE;
    const type = this.resolveType(param);
    const reusable = isReusableDestination(destination);

    // Verificar se é o primeiro item do package
    const existingItems = await this.itemRepository.findByCollectionRequestId(param.collectionRequestId);
    const isFirstItem = existingItems.length === 0;

    // Criar o item com storageUnit vazio. Fora dos destinos reutilizáveis os
    // indicadores básicos não decidem o lote, mas ficam registados se vierem.
    const itemData: Partial<Item> = {
      collectionRequest: collectionRequestEntity,
      destination,
      sex: param.sex ?? null,
      ageGroup: param.ageGroup ?? null,
      season: param.season ?? null,
      type,
      category: param.category ?? null,
      condition: param.condition ?? null,
      brand,
      quantity: param.quantity,
      denim: param.denim ?? null,
      material: param.material?.trim() || null,
      color: param.color?.trim() || null,
      size: param.size?.trim() || null,
      operator: param.operatorId ? ({ id: param.operatorId } as User) : null,
      storageUnit: null, // Inicialmente vazio
      bag: bag,
    };

    if (reusable && !resolveStorageSlot(itemData as Item)) {
      throw new BadRequestException('errors.item.missingBasicIndicators');
    }

    const createdItem = await this.itemRepository.create(itemData);

    // Se for o primeiro item, atualizar o status do package para SCREENING
    if (isFirstItem) {
      await this.collectionRequestRepository.update({ id: param.collectionRequestId }, {
        status: CollectionRequestStatus.SCREENING,
      });
    }

    return { ...createdItem, storageSlot: resolveStorageSlot(createdItem) };
  }

  /** Parte (Superior / Inferior): vem da categoria; `type` explícito tem de bater. */
  private resolveType(param: CreateItemDto): Type | null {
    if (!param.category) {
      return param.type ?? null;
    }
    const type = CATEGORY_PART[param.category];
    if (param.type && param.type !== type) {
      throw new BadRequestException('errors.item.categoryTypeMismatch');
    }
    return type;
  }
}
