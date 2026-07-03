import { Entity } from "../interfaces/entity.interface"
import { AgeGroup, Quality, Season, Sex, Type } from "../item/item.entity"

export interface StorageUnit extends Entity {
  quality: Quality
  sex: Sex
  ageGroup: AgeGroup
  type: Type
  season: Season
  weight: number
}