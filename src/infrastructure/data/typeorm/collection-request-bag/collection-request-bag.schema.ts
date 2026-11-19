import { EntitySchema } from 'typeorm';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const collectionRequestBagSchema = new EntitySchema<CollectionRequestBag>({
  name: 'collection_request_bag',
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
    collectionRequestId: {
      type: 'uuid',
      nullable: true,
      name: 'collection_request_id',
    },
    routeId: {
      type: 'uuid',
      nullable: true,
      name: 'route_id',
    },
    receivedAt: {
      type: 'timestamp with time zone',
      nullable: true,
      name: 'received_at',
    },
    receivedWeight: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: true,
      name: 'received_weight',
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
