import { EntitySchema } from 'typeorm';
import {
  OutboundStatus,
  OutboundType,
  WarehouseOutbound,
} from '../../../../domain/warehouse/warehouse-outbound.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const warehouseOutboundSchema = new EntitySchema<WarehouseOutbound>({
  name: 'warehouse_outbound',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    type: {
      type: 'enum',
      enum: OutboundType,
      enumName: 'warehouse_outbound_type_enum',
      nullable: false,
    },
    destination: {
      type: 'varchar',
      length: 150,
      nullable: false,
    },
    scheduledDate: {
      type: 'date',
      nullable: false,
      name: 'scheduled_date',
    },
    weight: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: true,
    },
    pieces: {
      type: 'integer',
      nullable: true,
    },
    notes: {
      type: 'varchar',
      length: 500,
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: OutboundStatus,
      enumName: 'warehouse_outbound_status_enum',
      nullable: false,
      default: OutboundStatus.SCHEDULED,
    },
    doneAt: {
      type: 'timestamp with time zone',
      nullable: true,
      name: 'done_at',
    },
    ...BaseTimestampColumns,
  },
});
