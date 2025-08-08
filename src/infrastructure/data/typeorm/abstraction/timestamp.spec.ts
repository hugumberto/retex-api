import { BaseTimestampColumns } from './timestamp';

describe('BaseTimestampColumns', () => {
  it('should return the correct columns', () => {
    const result = BaseTimestampColumns;
    expect(result).toEqual({
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
    });
  });
});
