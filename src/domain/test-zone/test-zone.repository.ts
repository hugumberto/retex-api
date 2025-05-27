import { IRepository } from '../interfaces/repository.interface';
import { TestZone } from './test-zone.entity';

export interface ITestZoneRepository extends IRepository<TestZone> {
  findByCity(city: string): Promise<TestZone | null>;
} 