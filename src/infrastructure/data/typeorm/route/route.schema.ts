import { EntitySchema } from 'typeorm';
import { Route, RouteStatus } from '../../../../domain/route/route.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const routeSchema = new EntitySchema<Route>({
  name: 'route',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    status: {
      type: 'enum',
      enum: RouteStatus,
      nullable: false,
    },
    startDate: {
      type: 'timestamp with time zone',
      nullable: false,
      name: 'start_date',
    },
    endDate: {
      type: 'timestamp with time zone',
      nullable: false,
      name: 'end_date',
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
      inverseSide: 'routes',
    },
    packages: {
      type: 'one-to-many',
      target: 'package',
      joinColumn: {
        name: 'route_id',
      },
      inverseSide: 'route',
    },
  },
}); 