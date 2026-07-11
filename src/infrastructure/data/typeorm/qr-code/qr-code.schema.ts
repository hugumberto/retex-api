import { EntitySchema } from 'typeorm';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const qrCodeSchema = new EntitySchema<QrCode>({
  name: 'qr_code',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    token: {
      type: 'varchar',
      nullable: false,
      unique: true,
    },
    friendlyCode: {
      type: 'varchar',
      nullable: false,
      unique: true,
      name: 'friendly_code',
    },
    batchId: {
      type: 'uuid',
      nullable: false,
      name: 'batch_id',
    },
    usedAt: {
      type: 'timestamp with time zone',
      nullable: true,
      name: 'used_at',
    },
    packageId: {
      type: 'uuid',
      nullable: true,
      name: 'package_id',
    },
    routeId: {
      type: 'uuid',
      nullable: true,
      name: 'route_id',
    },
    weight: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: true,
    },
    processedAt: {
      type: 'timestamp with time zone',
      nullable: true,
      name: 'processed_at',
    },
    ...BaseTimestampColumns,
  },
});
