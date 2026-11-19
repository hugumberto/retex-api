import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StorageUnitStatus } from '../../../../domain/storage-unit/storage-unit.entity';
import { IStorageUnitRepository } from '../../../../domain/storage-unit/storage-unit.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import {
  OutboundStatus,
  WarehouseOutbound,
} from '../../../../domain/warehouse/warehouse-outbound.entity';
import { IWarehouseOutboundRepository } from '../../../../domain/warehouse/warehouse.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

export type ChangeOutboundStatusParams = {
  id: string;
  status: OutboundStatus.DONE | OutboundStatus.CANCELLED;
};

/**
 * Fecha uma saída. Feita: os lotes que leva ficam inativos (saíram do armazém
 * e deixam de contar na zona) e o peso / peças passam a ser a soma deles.
 * Cancelada: os lotes ficam livres para outra saída.
 */
@Injectable()
export class ChangeOutboundStatusUseCase
  implements IUseCase<ChangeOutboundStatusParams, WarehouseOutbound>
{
  constructor(
    @Inject(DOMAIN_TOKENS.WAREHOUSE_OUTBOUND_REPOSITORY)
    private readonly outboundRepository: IWarehouseOutboundRepository,
    @Inject(DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY)
    private readonly storageUnitRepository: IStorageUnitRepository,
  ) {}

  async call({ id, status }: ChangeOutboundStatusParams): Promise<WarehouseOutbound> {
    const outbound = await this.outboundRepository.findWithUnits(id);
    if (!outbound) throw new NotFoundException('errors.outbound.notFound');
    if (outbound.status !== OutboundStatus.SCHEDULED) {
      throw new BadRequestException('errors.outbound.notScheduled');
    }

    const units = outbound.storageUnits ?? [];
    if (status === OutboundStatus.CANCELLED) {
      await this.outboundRepository.setUnits(id, []);
      await this.outboundRepository.update({ id }, { status });
    } else {
      for (const unit of units) {
        await this.storageUnitRepository.update({ id: unit.id }, { status: StorageUnitStatus.INATIVO });
      }
      const patch: Partial<WarehouseOutbound> = { status, doneAt: new Date() };
      if (units.length > 0) {
        const weight = units.reduce((sum, u) => sum + Number(u.weight ?? 0), 0);
        if (weight > 0) patch.weight = Math.round(weight * 100) / 100;
        patch.pieces = units.reduce((sum, u) => sum + (u.itemsCount ?? 0), 0);
      }
      await this.outboundRepository.update({ id }, patch);
    }
    return (await this.outboundRepository.findWithUnits(id)) as WarehouseOutbound;
  }
}
