import { Address } from '../address/address.entity';
import { Entity } from '../interfaces/entity.interface';
import { Item } from '../item/item.entity';
import { Route } from '../route/route.entity';
import { User } from '../user/user.entity';

export interface Package extends Entity {
  status: PackageStatus;
  user: User;
  route?: Route;
  weight?: number;
  collectDay?: string;
  collectTime?: string;
  address?: Address;
  addressId?: string;
  items?: Item[];
}

export enum PackageStatus {
  CREATED = 'CREATED',
  OUT_OF_ZONE = 'OUT_OF_ZONE',
  WAITING_FOR_COLLECTION = 'WAITING_FOR_COLLECTION',
  COLLECTED = 'COLLECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  IN_HOUSE = 'IN_HOUSE',
  CANCELLED = 'CANCELLED',
  SCREENING = 'SCREENING',
  STOCKED = 'STOCKED',
}
