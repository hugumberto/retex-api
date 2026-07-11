import { Brand } from "../brand/brand.entity"
import { Entity } from "../interfaces/entity.interface"
import { Package } from "../package/package.entity"
import { QrCode } from "../qr-code/qr-code.entity"
import { StorageUnit } from "../storage-unit/storage-unit.entity"

export interface Item extends Entity {
  package: Package
  quality: Quality
  type: Type
  storageUnit: StorageUnit
  season: Season
  sex: Sex
  ageGroup: AgeGroup
  brand: Brand
  quantity: number
  // Volume (QR code) ao qual este item pertence, definido na triagem.
  qrCode?: QrCode | null
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

export enum Sex {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum AgeGroup {
  ADULT = "ADULT",
  CHILD = "CHILD",
}