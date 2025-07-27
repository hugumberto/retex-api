import { Brand } from "../brand/brand.entity"
import { Entity } from "../interfaces/entity.interface"
import { Package } from "../package/package.entity"
import { StorageUnit } from "../storage-unit/storage-unit.entity"

export interface Item extends Entity {
  package: Package
  quality: Quality
  type: Type
  storageUnit: StorageUnit
  season: Season
  brand: Brand
  quantity: number
}

export enum Quality {
  GOOD = "GOOD",
  MEDIUM = "MEDIUM",
  BAD = "BAD",
}

export enum Type {
  UPPER_PART = "UPPER_PART",
  UNDER_PART = "UNDER_PART",
}

export enum Season {
  SUMMER = "SUMMER",
  WINTER = "WINTER",
}