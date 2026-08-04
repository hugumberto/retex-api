import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetCollectionRequestDetailUseCase } from '.';

const UUID = '4f00094b-59b1-45cd-82a9-d6b32357ec07';

describe('GetCollectionRequestDetailUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const bagRepo = mock<ICollectionRequestBagRepository>();
  let useCase: GetCollectionRequestDetailUseCase;

  const entity = { id: UUID } as CollectionRequest;
  const bags = [{ id: 'b1' } as CollectionRequestBag];

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetCollectionRequestDetailUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepo },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY, useValue: bagRepo },
      ],
    }).compile();
    useCase = module.get(GetCollectionRequestDetailUseCase);

    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(entity);
    bagRepo.find.mockResolvedValue(bags);
  });

  // As quatro formas de identificador que circulam no sistema. Antes estavam
  // repartidas por três use-cases, cada um a suportar só um subconjunto.
  it('resolves by the collection request UUID', async () => {
    const result = await useCase.call(UUID);

    expect(collectionRequestRepo.findOne).not.toHaveBeenCalled();
    expect(collectionRequestRepo.findOneWithAllRelations).toHaveBeenCalledWith(UUID);
    expect(result).toEqual({ collectionRequest: entity, bags });
  });

  it('resolves by the collection request friendly code', async () => {
    collectionRequestRepo.findOne.mockResolvedValue(entity);

    const result = await useCase.call('2026-NR38BC');

    expect(collectionRequestRepo.findOne).toHaveBeenCalledWith({ friendlyCode: '2026-NR38BC' });
    expect(result.collectionRequest).toBe(entity);
  });

  it('resolves by a bag token', async () => {
    collectionRequestRepo.findOne.mockResolvedValue(null);
    bagRepo.findOne.mockResolvedValueOnce({ collectionRequestId: UUID } as CollectionRequestBag);

    await useCase.call('deadbeef');

    expect(bagRepo.findOne).toHaveBeenCalledWith({ token: 'deadbeef' });
    expect(collectionRequestRepo.findOneWithAllRelations).toHaveBeenCalledWith(UUID);
  });

  it('resolves by a bag friendly code', async () => {
    collectionRequestRepo.findOne.mockResolvedValue(null);
    bagRepo.findOne
      .mockResolvedValueOnce(null) // por token
      .mockResolvedValueOnce({ collectionRequestId: UUID } as CollectionRequestBag);

    await useCase.call('2026-2L6SNE');

    expect(bagRepo.findOne).toHaveBeenLastCalledWith({ friendlyCode: '2026-2L6SNE' });
    expect(collectionRequestRepo.findOneWithAllRelations).toHaveBeenCalledWith(UUID);
  });

  it('throws when no identifier form matches', async () => {
    collectionRequestRepo.findOne.mockResolvedValue(null);
    bagRepo.findOne.mockResolvedValue(null);

    await expect(useCase.call('nao-existe')).rejects.toThrow(NotFoundException);
    expect(collectionRequestRepo.findOneWithAllRelations).not.toHaveBeenCalled();
  });
});
