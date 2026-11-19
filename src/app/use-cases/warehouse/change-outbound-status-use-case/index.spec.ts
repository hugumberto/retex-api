import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { StorageUnitStatus } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { OutboundStatus } from '../../../../domain/warehouse/warehouse-outbound.entity';
import { IWarehouseOutboundRepository } from '../../../../domain/warehouse/warehouse.repository';
import { ChangeOutboundStatusUseCase } from '.';

describe('ChangeOutboundStatusUseCase', () => {
  const outbounds = mock<IWarehouseOutboundRepository>();
  const units = mock<IStorageUnitRepository>();
  let useCase: ChangeOutboundStatusUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ChangeOutboundStatusUseCase,
        { provide: DOMAIN_TOKENS.WAREHOUSE_OUTBOUND_REPOSITORY, useValue: outbounds },
        { provide: DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY, useValue: units },
      ],
    }).compile();
    useCase = module.get(ChangeOutboundStatusUseCase);
  });

  it('feita: inativa os lotes e soma peso e peças', async () => {
    outbounds.findWithUnits.mockResolvedValue({
      id: 'o1',
      status: OutboundStatus.SCHEDULED,
      storageUnits: [
        { id: 'u1', weight: 12.5, itemsCount: 40 },
        { id: 'u2', weight: 0, itemsCount: 10 },
      ],
    } as any);

    await useCase.call({ id: 'o1', status: OutboundStatus.DONE });

    expect(units.update).toHaveBeenCalledWith({ id: 'u1' }, { status: StorageUnitStatus.INATIVO });
    expect(units.update).toHaveBeenCalledWith({ id: 'u2' }, { status: StorageUnitStatus.INATIVO });
    expect(outbounds.update).toHaveBeenCalledWith(
      { id: 'o1' },
      { status: OutboundStatus.DONE, doneAt: expect.any(Date), weight: 12.5, pieces: 50 },
    );
  });

  it('cancelada: liberta os lotes sem os inativar', async () => {
    outbounds.findWithUnits.mockResolvedValue({ id: 'o1', status: OutboundStatus.SCHEDULED, storageUnits: [{ id: 'u1' }] } as any);

    await useCase.call({ id: 'o1', status: OutboundStatus.CANCELLED });

    expect(outbounds.setUnits).toHaveBeenCalledWith('o1', []);
    expect(units.update).not.toHaveBeenCalled();
  });

  it('não reabre uma saída fechada', async () => {
    outbounds.findWithUnits.mockResolvedValue({ id: 'o1', status: OutboundStatus.DONE } as any);
    await expect(useCase.call({ id: 'o1', status: OutboundStatus.CANCELLED })).rejects.toThrow(BadRequestException);
  });
});
