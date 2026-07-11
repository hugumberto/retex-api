import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ProcessCollectionSchedulesUseCase } from '.';

describe('ProcessCollectionSchedulesUseCase', () => {
  const packageRepo = mock<IPackageRepository>();
  const systemParamRepo = mock<ISystemParameterRepository>();
  let useCase: ProcessCollectionSchedulesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProcessCollectionSchedulesUseCase,
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
        { provide: DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY, useValue: systemParamRepo },
      ],
    }).compile();
    useCase = module.get(ProcessCollectionSchedulesUseCase);
    systemParamRepo.getSingleton.mockResolvedValue({
      collectionConfirmationDeadlineDays: 2,
    } as SystemParameter);
  });

  it('removes expired unconfirmed from route and moves due confirmed to WAITING', async () => {
    packageRepo.findExpiredUnconfirmed.mockResolvedValue([{ id: 'e1' } as Package]);
    packageRepo.findDueConfirmed.mockResolvedValue([{ id: 'd1' } as Package]);

    const result = await useCase.call();

    expect(packageRepo.findExpiredUnconfirmed).toHaveBeenCalledWith(2);
    expect(packageRepo.update).toHaveBeenCalledWith(
      { id: 'e1' },
      { route: null, collectionConfirmationToken: null },
    );
    expect(packageRepo.update).toHaveBeenCalledWith(
      { id: 'd1' },
      { status: 'WAITING_FOR_COLLECTION' },
    );
    expect(result).toEqual({ removedFromRoute: 1, movedToWaiting: 1 });
  });
});
