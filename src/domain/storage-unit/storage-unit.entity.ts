import { Entity } from "../interfaces/entity.interface"
import { AgeGroup, Quality, Season, Sex, Type } from "../item/item.entity"

export enum StorageUnitStatus {
  ATIVO = "ATIVO",
  INATIVO = "INATIVO",
}

export interface StorageUnit extends Entity {
  // Código amigável (`ano-XXXXXX`) usado como referência na lista e na etiqueta.
  friendlyCode?: string | null
  quality: Quality
  sex: Sex
  ageGroup: AgeGroup
  type: Type
  season: Season
  status: StorageUnitStatus
  weight: number
}