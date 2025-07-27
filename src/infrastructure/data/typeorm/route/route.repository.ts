import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { routeSchema } from './route.schema';

@Injectable()
export class RouteRepository extends BaseRepository<Route> implements IRouteRepository {
  constructor(
    @InjectRepository(routeSchema)
    private readonly routeRepository: Repository<Route>,
  ) {
    super(routeRepository);
  }
} 