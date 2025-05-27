import { BaseTimestampColumns } from './timestamp';

describe('BaseTimestampColumns', () => {
  it('should return the correct columns', () => {
    const result = BaseTimestampColumns;
    expect(result).toEqual({
      createdAt: {
        type: 'timestamp with time zone',
        createDate: true,
      },
      updatedAt: {
        type: 'timestamp with time zone',
        updateDate: true,
      },
      deletedAt: {
        type: 'timestamp with time zone',
        deleteDate: true,
      },
    });
  });
});
