import { IRepository } from '../interfaces/repository.interface';
import { Package } from './package.entity';

export interface IPackageRepository extends IRepository<Package> { } 