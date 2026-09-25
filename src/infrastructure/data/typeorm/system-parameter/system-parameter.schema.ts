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
    ...BaseTimestampColumns,
  },
});
