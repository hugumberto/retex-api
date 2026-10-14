import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { Item } from '../../../../domain/item/item.entity';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CreateItemUseCase } from '.';

describe('CreateItemUseCase', () => {
  let useCase: CreateItemUseCase;
  const itemRepositoryMock = mock<IItemRepository>();
  const collectionRequestRepositoryMock = mock<ICollectionRequestRepository>();
  const brandRepositoryMock = mock<IBrandRepository>();
  const collectionRequestBagRepositoryMock = mock<ICollectionRequestBagRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateItemUseCase,
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: itemRepositoryMock },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepositoryMock },
        { provide: DOMAIN_TOKENS.BRAND_REPOSITORY, useValue: brandRepositoryMock },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY, useValue: collectionRequestBagRepositoryMock },
      ],
    }).compile();
    useCase = module.get(CreateItemUseCase);
  });

  const param = {
    collectionRequestId: 'p1', brandId: 'b1', condition: 'GOOD', category: 'TOP', season: 'SUMMER',
    sex: 'MALE', ageGroup: 'ADULT', quantity: 3,
  } as any;

  const arrange = () => {
    collectionRequestRepositoryMock.findOne.mockResolvedValue({ id: 'p1' } as any);
    brandRepositoryMock.findOne.mockResolvedValue({ id: 'b1' } as any);
    itemRepositoryMock.findByCollectionRequestId.mockResolvedValue([{ id: 'existing' } as Item]);
    itemRepositoryMock.create.mockImplementation(async (data) => ({ id: 'new', ...data }) as Item);
  };

  it('throws when the package does not exist', async () => {
    collectionRequestRepositoryMock.findOne.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('throws when the brand does not exist', async () => {
    collectionRequestRepositoryMock.findOne.mockResolvedValue({ id: 'p1' } as any);
    brandRepositoryMock.findOne.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('moves the package to SCREENING on the first item', async () => {
    collectionRequestRepositoryMock.findOne.mockResolvedValue({ id: 'p1' } as any);
    brandRepositoryMock.findOne.mockResolvedValue({ id: 'b1' } as any);
    itemRepositoryMock.findByCollectionRequestId.mockResolvedValue([]);
    itemRepositoryMock.create.mockResolvedValue({ id: 'i1' } as Item);

    await useCase.call(param);

    expect(collectionRequestRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: CollectionRequestStatus.SCREENING },
    );
  });

  it('does not change package status for subsequent items', async () => {
    collectionRequestRepositoryMock.findOne.mockResolvedValue({ id: 'p1' } as any);
    brandRepositoryMock.findOne.mockResolvedValue({ id: 'b1' } as any);
    itemRepositoryMock.findByCollectionRequestId.mockResolvedValue([{ id: 'existing' } as Item]);
    itemRepositoryMock.create.mockResolvedValue({ id: 'i2' } as Item);

    await useCase.call(param);

    expect(collectionRequestRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('deriva a parte (Superior / Inferior) da categoria e indica o lote', async () => {
    arrange();
    const result = await useCase.call({ ...param, category: 'TROUSERS', operatorId: 'u1' });

    expect(itemRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UNDER_PART',
        destination: 'REUSE',
        operator: { id: 'u1' },
      }),
    );
    expect(result.storageSlot).toEqual({ group: 'MEN', season: 'SUMMER', type: 'UNDER_PART' });
  });

  it('rejeita type que não bate com a categoria', async () => {
    arrange();
    await expect(
      useCase.call({ ...param, category: 'DRESS', type: 'UNDER_PART' }),
    ).rejects.toThrow(BadRequestException);
    expect(itemRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('rejeita peça reutilizável sem os indicadores básicos', async () => {
    arrange();
    await expect(useCase.call({ ...param, season: undefined })).rejects.toThrow(BadRequestException);
    expect(itemRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('aceita peça não reutilizável sem marca nem indicadores básicos', async () => {
    arrange();
    const result = await useCase.call({
      collectionRequestId: 'p1', destination: 'NON_REUSABLE', quantity: 2,
    } as any);

    expect(brandRepositoryMock.findOne).not.toHaveBeenCalled();
    expect(result.storageSlot).toEqual({ group: 'NON_REUSABLE', season: null, type: null });
  });

  it('regista acessórios sem lote', async () => {
    arrange();
    const result = await useCase.call({
      collectionRequestId: 'p1', destination: 'ACCESSORY', quantity: 1,
    } as any);
    expect(result.storageSlot).toBeNull();
  });
});
