import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ProcessCollectionSchedulesUseCase } from '.';

describe('ProcessCollectionSchedulesUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const systemParamRepo = mock<ISystemParameterRepository>();
  let useCase: ProcessCollectionSchedulesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProcessCollectionSchedulesUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepo },
        { provide: DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY, useValue: systemParamRepo },
      ],
    }).compile();
    useCase = module.get(ProcessCollectionSchedulesUseCase);
    systemParamRepo.getSingleton.mockResolvedValue({
      collectionConfirmationDeadlineDays: 2,
    } as SystemParameter);
  });

  it('removes expired unconfirmed from route and moves due confirmed to WAITING', async () => {
    collectionRequestRepo.findExpiredUnconfirmed.mockResolvedValue([{ id: 'e1' } as CollectionRequest]);
    collectionRequestRepo.findDueConfirmed.mockResolvedValue([{ id: 'd1' } as CollectionRequest]);

    const result = await useCase.call();

    expect(collectionRequestRepo.findExpiredUnconfirmed).toHaveBeenCalledWith(2);
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'e1' },
      { route: null, collectionConfirmationToken: null },
    );
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'd1' },
      { status: 'WAITING_FOR_COLLECTION' },
    );
    expect(result).toEqual({ removedFromRoute: 1, movedToWaiting: 1 });
  });
});
