import { IRepository } from '../interfaces/repository.interface';
import { Address } from './address.entity';

export interface IAddressRepository extends IRepository<Address> {
  findByUser(userId: string): Promise<Address[]>;
  unsetDefault(userId: string): Promise<void>;
}
