import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CreateCollectionRequestBagUseCase } from '.';

describe('CreateCollectionRequestBagUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const bagRepo = mock<ICollectionRequestBagRepository>();
  let useCase: CreateCollectionRequestBagUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateCollectionRequestBagUseCase,
        {
          provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY,
          useValue: collectionRequestRepo,
        },
        {
          provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY,
          useValue: bagRepo,
        },
      ],
    }).compile();
    useCase = module.get(CreateCollectionRequestBagUseCase);
  });

  const requestIn = (status: CollectionRequestStatus, route?: { id: string }) =>
    ({ id: 'cr-1', status, route } as never);

  it('throws when the collection request does not exist', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(undefined);

    await expect(
      useCase.call({ collectionRequestId: 'cr-1' }),
    ).rejects.toThrow(NotFoundException);
    expect(bagRepo.create).not.toHaveBeenCalled();
  });

  it('creates a used bag bound to the request and to its route', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(
      requestIn(CollectionRequestStatus.WAITING_FOR_COLLECTION, { id: 'route-1' }),
    );
    bagRepo.findOne.mockResolvedValue(undefined); // friendlyCode livre
    bagRepo.create.mockImplementation(
      async (bag) => ({ id: 'bag-1', ...bag } as CollectionRequestBag),
    );
    bagRepo.find.mockResolvedValue([{ id: 'bag-1' } as CollectionRequestBag]);

    const bag = await useCase.call({ collectionRequestId: 'cr-1' });

    expect(bag.id).toBe('bag-1');
    expect(bagRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionRequestId: 'cr-1',
        routeId: 'route-1',
        usedAt: expect.any(Date),
        friendlyCode: expect.stringMatching(/^\d{4}-[A-Z2-9]{6}/),
        token: expect.stringMatching(/^[0-9a-f]{32}$/),
      }),
    );
    // bags_generated segue os sacos ativos da solicitação.
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'cr-1' },
      { bagsGenerated: 1 },
    );
  });

  it('creates the bag whatever the status is — é o objetivo do endpoint', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(
      requestIn(CollectionRequestStatus.STOCKED),
    );
    bagRepo.findOne.mockResolvedValue(undefined);
    bagRepo.create.mockImplementation(
      async (bag) => ({ id: 'bag-2', ...bag } as CollectionRequestBag),
    );
    bagRepo.find.mockResolvedValue([
      { id: 'bag-1' } as CollectionRequestBag,
      { id: 'bag-2' } as CollectionRequestBag,
    ]);

    const bag = await useCase.call({ collectionRequestId: 'cr-1' });

    expect(bag.id).toBe('bag-2');
    // Sem rota associada, o saco fica só ligado à solicitação.
    expect(bagRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ routeId: null, collectionRequestId: 'cr-1' }),
    );
  });
});
