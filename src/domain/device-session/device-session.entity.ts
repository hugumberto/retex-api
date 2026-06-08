import { Entity } from '../interfaces/entity.interface';

export interface DeviceSession extends Entity {
  userId: string;
  deviceId: string;
  deviceLabel: string;
  active: boolean;
}
