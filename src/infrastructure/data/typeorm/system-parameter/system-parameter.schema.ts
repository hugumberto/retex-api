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
    ...BaseTimestampColumns,
  },
});
