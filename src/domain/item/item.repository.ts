import { IRepository } from '../interfaces/repository.interface';
import { Item } from './item.entity';

export interface IItemRepository extends IRepository<Item> { } 