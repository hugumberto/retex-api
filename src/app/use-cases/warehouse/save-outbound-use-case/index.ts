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
import { SaveOutboundDto } from './save-outbound.dto';

export { SaveOutboundDto };

/** Cria (sem `id`) ou altera uma saída ainda programada. */
@Injectable()
export class SaveOutboundUseCase
  implements IUseCase<{ id?: string; data: SaveOutboundDto }, WarehouseOutbound>
{
  constructor(
    @Inject(DOMAIN_TOKENS.WAREHOUSE_OUTBOUND_REPOSITORY)
    private readonly outboundRepository: IWarehouseOutboundRepository,
    @Inject(DOMAIN_TOKENS.STORAGE_UNIT_REPOSITORY)
    private readonly storageUnitRepository: IStorageUnitRepository,
  ) {}

  async call({ id, data }: { id?: string; data: SaveOutboundDto }): Promise<WarehouseOutbound> {
    const unitIds = [...new Set(data.storageUnitIds ?? [])];
    if (unitIds.length > 0) {
      const units = await this.storageUnitRepository.findByIds(unitIds);
      const usable = units.filter(
        (u) => u.status === StorageUnitStatus.ATIVO && (!u.outboundId || u.outboundId === id),
      );
      if (usable.length !== unitIds.length) {
        throw new BadRequestException('errors.outbound.invalidUnits');
      }
    }

    const fields: Partial<WarehouseOutbound> = {
      type: data.type,
      destination: data.destination.trim(),
      scheduledDate: data.scheduledDate,
      weight: data.weight ?? null,
      pieces: data.pieces ?? null,
      notes: data.notes?.trim() || null,
    };

    let outboundId = id;
    if (id) {
      const existing = await this.outboundRepository.findOne({ id });
      if (!existing) throw new NotFoundException('errors.outbound.notFound');
      if (existing.status !== OutboundStatus.SCHEDULED) {
        throw new BadRequestException('errors.outbound.notScheduled');
      }
      await this.outboundRepository.update({ id }, fields);
    } else {
      const created = await this.outboundRepository.create({
        ...fields,
        status: OutboundStatus.SCHEDULED,
      });
      outboundId = created.id;
    }

    await this.outboundRepository.setUnits(outboundId as string, unitIds);
    return (await this.outboundRepository.findWithUnits(outboundId as string)) as WarehouseOutbound;
  }
}
