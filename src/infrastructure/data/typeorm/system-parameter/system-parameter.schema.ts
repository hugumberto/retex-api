import { EntitySchema } from 'typeorm';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const systemParameterSchema = new EntitySchema<SystemParameter>({
  name: 'system_parameter',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    collectionConfirmationDeadlineDays: {
      type: 'integer',
      nullable: false,
      default: 2,
      name: 'collection_confirmation_deadline_days',
    },
    qrCodeThresholdPercentage: {
      type: 'integer',
      nullable: false,
      default: 10,
      name: 'qr_code_threshold_percentage',
    },
    labelWidthMm: {
      type: 'integer',
      nullable: false,
      default: 50,
      name: 'label_width_mm',
    },
    labelHeightMm: {
      type: 'integer',
      nullable: false,
      default: 30,
      name: 'label_height_mm',
    },
    labelQrSizeMm: {
      type: 'integer',
      nullable: false,
      default: 24,
      name: 'label_qr_size_mm',
    },
    labelRotationDeg: {
      type: 'integer',
      nullable: false,
      default: 90,
      name: 'label_rotation_deg',
    },
    warehouseAddress: {
      type: 'varchar',
      length: 255,
      nullable: true,
      name: 'warehouse_address',
    },
    warehouseLat: {
      type: 'decimal',
      precision: 10,
      scale: 7,
      nullable: true,
      name: 'warehouse_lat',
    },
    warehouseLong: {
      type: 'decimal',
      precision: 10,
      scale: 7,
      nullable: true,
      name: 'warehouse_long',
    },
    stopBaseMinutes: {
      type: 'integer',
      nullable: false,
      default: 5,
      name: 'stop_base_minutes',
    },
    stopMinutesPerBag: {
      type: 'integer',
      nullable: false,
      default: 1,
      name: 'stop_minutes_per_bag',
    },
    ...BaseTimestampColumns,
  },
});
