import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ReceiveBagUseCase } from '.';

describe('ReceiveBagUseCase', () => {
  const bags = mock<ICollectionRequestBagRepository>();
  const requests = mock<ICollectionRequestRepository>();
  let useCase: ReceiveBagUseCase;

  const request = (status = CollectionRequestStatus.COLLECTED) =>
    ({ id: 'cr1', friendlyCode: '2026-AAAAAA', status }) as any;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ReceiveBagUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY, useValue: bags },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: requests },
      ],
    }).compile();
    useCase = module.get(ReceiveBagUseCase);
    bags.update.mockResolvedValue([]);
    requests.update.mockResolvedValue([]);
  });

  it('regista um saco pelo código e deixa o pedido recolhido enquanto faltam sacos', async () => {
    const bag = { id: 'b1', collectionRequestId: 'cr1', receivedAt: null };
    bags.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(bag as any);
    requests.findOne.mockResolvedValue(request());
    bags.find.mockResolvedValue([bag, { id: 'b2', collectionRequestId: 'cr1', receivedAt: null }] as any);

    const result = await useCase.call({ code: ' 2026-abc123 ', weight: 4.6 });

    expect(bags.findOne).toHaveBeenLastCalledWith({ friendlyCode: '2026-ABC123' });
    expect(bags.update).toHaveBeenCalledWith(
      { id: 'b1' },
      { receivedAt: expect.any(Date), receivedWeight: 4.6 },
    );
    expect(result).toMatchObject({ bagsReceived: 1, bagsLinked: 2, status: CollectionRequestStatus.COLLECTED });
    expect(requests.update).not.toHaveBeenCalled();
  });

  it('passa o pedido a IN_HOUSE quando entra o último saco', async () => {
    const bag = { id: 'b2', collectionRequestId: 'cr1', receivedAt: null };
    bags.findOne.mockResolvedValueOnce(bag as any);
    requests.findOne.mockResolvedValue(request());
    bags.find.mockResolvedValue([{ id: 'b1', receivedAt: new Date() }, bag] as any);

    const result = await useCase.call({ code: 'tokenhex', weight: 3 });

    expect(result.status).toBe(CollectionRequestStatus.IN_HOUSE);
    expect(requests.update).toHaveBeenCalledWith({ id: 'cr1' }, { status: CollectionRequestStatus.IN_HOUSE });
  });

  it('com o código do pedido, reparte o peso pelos sacos que faltam', async () => {
    bags.findOne.mockResolvedValue(null);
    requests.findOne.mockResolvedValue(request());
    bags.find.mockResolvedValue([
      { id: 'b1', receivedAt: new Date() },
      { id: 'b2', receivedAt: null },
      { id: 'b3', receivedAt: null },
      { id: 'b4', receivedAt: null },
    ] as any);

    const result = await useCase.call({ code: '2026-aaaaaa', weight: 10 });

    const weights = bags.update.mock.calls.map(([, data]) => data.receivedWeight);
    expect(weights).toEqual([3.34, 3.33, 3.33]);
    expect(result).toMatchObject({ bagsReceivedNow: 3, bagsReceived: 4, status: CollectionRequestStatus.IN_HOUSE });
  });

  it('recusa um saco que já entrou', async () => {
    bags.findOne.mockResolvedValueOnce({ id: 'b1', collectionRequestId: 'cr1', receivedAt: new Date() } as any);
    await expect(useCase.call({ code: 'x', weight: 1 })).rejects.toThrow(ConflictException);
  });

  it('recusa um pedido que ainda não foi recolhido', async () => {
    bags.findOne.mockResolvedValueOnce({ id: 'b1', collectionRequestId: 'cr1', receivedAt: null } as any);
    requests.findOne.mockResolvedValue(request(CollectionRequestStatus.WAITING_FOR_COLLECTION));
    await expect(useCase.call({ code: 'x', weight: 1 })).rejects.toThrow(BadRequestException);
    expect(bags.update).not.toHaveBeenCalled();
  });

  it('código desconhecido', async () => {
    bags.findOne.mockResolvedValue(null);
    requests.findOne.mockResolvedValue(null);
    await expect(useCase.call({ code: 'nada', weight: 1 })).rejects.toThrow(NotFoundException);
  });
});
