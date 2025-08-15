import { Entity } from "../interfaces/entity.interface";
import { Package } from "../package/package.entity";
import { User } from "../user/user.entity";

export interface Route extends Entity {
  status: RouteStatus
  driver: User
  packages: Package[]
  startDate: Date
  endDate?: Date
}

export enum RouteStatus {
  DRAFTING = 'DRAFTING',
  CREATED = 'CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  FINISHED = 'FINISHED',
}