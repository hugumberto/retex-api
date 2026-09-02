import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { IItemRepository } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ProcessTriageQrUseCase } from '.';

describe('ProcessTriageQrUseCase', () => {
  const collectionRequestBagRepo = mock<ICollectionRequestBagRepository>();
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const itemRepo = mock<IItemRepository>();
  let useCase: ProcessTriageQrUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProcessTriageQrUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY, useValue: collectionRequestBagRepo },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepo },
        { provide: DOMAIN_TOKENS.ITEM_REPOSITORY, useValue: itemRepo },
      ],
    }).compile();
    useCase = module.get(ProcessTriageQrUseCase);

    // Por omissão o saco tem itens; os testes que precisam do contrário dizem-no.
    itemRepo.countByBagId.mockResolvedValue(1);
  });

  it('throws when the QR is not linked to a package', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: null } as CollectionRequestBag);
    await expect(useCase.call({ bagId: 'q1', weight: 2 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when the package is not in collection/screening', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: 'p1' } as CollectionRequestBag);
    collectionRequestRepo.findOne.mockResolvedValue({ id: 'p1', status: 'STOCKED' } as CollectionRequest);
    await expect(useCase.call({ bagId: 'q1', weight: 2 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('sets weight+processedAt, recomputes the package weight and SCREENING', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: 'p1' } as CollectionRequestBag);
    collectionRequestRepo.findOne.mockResolvedValue({ id: 'p1', status: 'COLLECTED' } as CollectionRequest);
    collectionRequestBagRepo.update.mockResolvedValue([{ id: 'q1', weight: 4 } as CollectionRequestBag]);
    collectionRequestBagRepo.find.mockResolvedValue([
      { weight: '4.00' } as unknown as CollectionRequestBag,
      { weight: '3.00' } as unknown as CollectionRequestBag,
    ]);

    await useCase.call({ bagId: 'q1', weight: 4 });

    expect(collectionRequestBagRepo.update).toHaveBeenCalledWith(
      { id: 'q1' },
      expect.objectContaining({ weight: 4, processedAt: expect.any(Date) }),
    );
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { weight: 7, status: 'SCREENING' },
    );
  });

  it('saves only the weight when markProcessed is false', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: 'p1' } as CollectionRequestBag);
    collectionRequestRepo.findOne.mockResolvedValue({ id: 'p1', status: 'COLLECTED' } as CollectionRequest);
    collectionRequestBagRepo.update.mockResolvedValue([{ id: 'q1', weight: 4 } as CollectionRequestBag]);
    collectionRequestBagRepo.find.mockResolvedValue([
      { weight: '4.00' } as unknown as CollectionRequestBag,
    ]);

    await useCase.call({ bagId: 'q1', weight: 4, markProcessed: false });

    // Sem processedAt no update — o volume fica por terminar.
    expect(collectionRequestBagRepo.update).toHaveBeenCalledWith(
      { id: 'q1' },
      { weight: 4 },
    );
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { weight: 4, status: 'SCREENING' },
    );
  });

  it('refuses to close a bag with no items', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: 'p1' } as CollectionRequestBag);
    collectionRequestRepo.findOne.mockResolvedValue({ id: 'p1', status: 'COLLECTED' } as CollectionRequest);
    itemRepo.countByBagId.mockResolvedValue(0);

    await expect(useCase.call({ bagId: 'q1', weight: 4 })).rejects.toThrow(
      BadRequestException,
    );
    // Nada gravado: um saco vazio não pode entrar no peso do pacote nem contar
    // como processado.
    expect(collectionRequestBagRepo.update).not.toHaveBeenCalled();
    expect(collectionRequestRepo.update).not.toHaveBeenCalled();
  });

  it('still saves progress on an empty bag (markProcessed false)', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue({ id: 'q1', collectionRequestId: 'p1' } as CollectionRequestBag);
    collectionRequestRepo.findOne.mockResolvedValue({ id: 'p1', status: 'COLLECTED' } as CollectionRequest);
    collectionRequestBagRepo.update.mockResolvedValue([{ id: 'q1', weight: 4 } as CollectionRequestBag]);
    collectionRequestBagRepo.find.mockResolvedValue([
      { weight: '4.00' } as unknown as CollectionRequestBag,
    ]);
    itemRepo.countByBagId.mockResolvedValue(0);

    // "Guardar progresso" existe para não perder o peso a meio do volume, antes
    // de haver itens — bloqueá-lo aqui tirava-lhe a razão de ser.
    await expect(
      useCase.call({ bagId: 'q1', weight: 4, markProcessed: false }),
    ).resolves.toBeDefined();
    expect(collectionRequestBagRepo.update).toHaveBeenCalledWith(
      { id: 'q1' },
      { weight: 4 },
    );
  });

  it('throws NotFound when the QR does not exist', async () => {
    collectionRequestBagRepo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ bagId: 'x', weight: 1 })).rejects.toThrow(
      NotFoundException,
    );
  });
});
