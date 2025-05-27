import { EntitySchemaColumnOptions } from 'typeorm';

type TimestampColumns = {
  createdAt: EntitySchemaColumnOptions;
  updatedAt: EntitySchemaColumnOptions;
  deletedAt: EntitySchemaColumnOptions;
};

export const BaseTimestampColumns: TimestampColumns = {
  createdAt: {
    type: 'timestamp with time zone',
    createDate: true,
    name: 'created_at',
  },
  updatedAt: {
    type: 'timestamp with time zone',
    updateDate: true,
    name: 'updated_at',
  },
  deletedAt: {
    type: 'timestamp with time zone',
    deleteDate: true,
    name: 'deleted_at',
  },
};
