import { EntitySchema } from 'typeorm';
import {
  CollectionRequest,
  CollectionRequestStatus,
} from '../../../../domain/collection-request/collection-request.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const collectionRequestSchema = new EntitySchema<CollectionRequest>({
  name: 'collection_request',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    status: {
      type: 'enum',
      enum: CollectionRequestStatus,
      nullable: false,
    },
    friendlyCode: {
      type: 'varchar',
      length: 32,
      nullable: true,
      unique: true,
      name: 'friendly_code',
    },
    weight: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: true,
    },
    estimatedVolumes: {
      type: 'integer',
      nullable: true,
      name: 'estimated_volumes',
    },
    addressId: {
      type: 'uuid',
      nullable: true,
      name: 'address_id',
    },
    collectionConfirmationToken: {
      type: 'varchar',
      length: 255,
      nullable: true,
      unique: true,
      select: false,
      name: 'collection_confirmation_token',
    },
    collectionConfirmedAt: {
      type: 'timestamp with time zone',
      nullable: true,
      name: 'collection_confirmed_at',
    },
    qrCodesGenerated: {
      type: 'integer',
      nullable: false,
      default: 0,
      name: 'qr_codes_generated',
    },
    cancellationReason: {
      type: 'text',
      nullable: true,
      name: 'cancellation_reason',
    },
    ...BaseTimestampColumns,
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'user',
      joinColumn: {
        name: 'user_id',
      },
      inverseSide: 'collectionRequests',
    },
    address: {
      type: 'many-to-one',
      target: 'user_address',
      joinColumn: {
        name: 'address_id',
      },
      nullable: true,
    },
    route: {
      type: 'many-to-one',
      target: 'route',
      joinColumn: {
        name: 'route_id',
      },
      inverseSide: 'collectionRequests',
      nullable: true,
    },
    items: {
      type: 'one-to-many',
      target: 'item',
      joinColumn: {
        name: 'collection_request_id',
      },
      inverseSide: 'collectionRequest',
    },
  },
});
