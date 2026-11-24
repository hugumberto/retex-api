import { EntitySchema } from 'typeorm';
import {
  TriageEvent,
  TriageEventType,
  TriageStation,
  TriageStationStatus,
} from '../../../../domain/triage-station/triage-station.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const triageStationSchema = new EntitySchema<TriageStation>({
  name: 'triage_station',
  columns: {
    id: { primary: true, type: 'uuid', generated: 'uuid' },
    number: { type: 'integer', nullable: false, unique: true },
    operatorId: { type: 'uuid', nullable: true, name: 'operator_id' },
    collectionRequestId: { type: 'uuid', nullable: true, name: 'collection_request_id' },
    assignedRequestId: { type: 'uuid', nullable: true, name: 'assigned_request_id' },
    status: {
      type: 'enum',
      enum: TriageStationStatus,
      enumName: 'triage_station_status_enum',
      nullable: false,
      default: TriageStationStatus.FREE,
    },
    sessionStartedAt: { type: 'timestamp with time zone', nullable: true, name: 'session_started_at' },
    lastSeenAt: { type: 'timestamp with time zone', nullable: true, name: 'last_seen_at' },
    pendingLots: { type: 'jsonb', nullable: true, name: 'pending_lots' },
    ...BaseTimestampColumns,
  },
});

export const triageEventSchema = new EntitySchema<TriageEvent>({
  name: 'triage_event',
  columns: {
    id: { primary: true, type: 'uuid', generated: 'uuid' },
    station: { type: 'integer', nullable: false },
    type: {
      type: 'enum',
      enum: TriageEventType,
      enumName: 'triage_event_type_enum',
      nullable: false,
    },
    operatorId: { type: 'uuid', nullable: true, name: 'operator_id' },
    code: { type: 'varchar', length: 100, nullable: false },
    requestCode: { type: 'varchar', length: 50, nullable: true, name: 'request_code' },
    otherRequestCode: { type: 'varchar', length: 50, nullable: true, name: 'other_request_code' },
    ...BaseTimestampColumns,
  },
});
