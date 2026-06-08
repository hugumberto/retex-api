import { EntitySchema } from 'typeorm';
import { DeviceSession } from '../../../../domain/device-session/device-session.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const deviceSessionSchema = new EntitySchema<DeviceSession>({
  name: 'device_session',
  columns: {
    id: { primary: true, type: 'uuid', generated: 'uuid' },
    userId: { type: 'varchar', nullable: false, name: 'user_id' },
    deviceId: { type: 'varchar', nullable: false, name: 'device_id' },
    deviceLabel: { type: 'varchar', nullable: false, name: 'device_label' },
    active: { type: 'boolean', nullable: false, default: true },
    ...BaseTimestampColumns,
  },
  indices: [
    { columns: ['user_id'] },
    { columns: ['user_id', 'active'] },
  ],
});
