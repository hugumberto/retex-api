import { Brand } from "../brand/brand.entity"
import { Entity } from "../interfaces/entity.interface"
import { Quality } from "../item/item.entity"

export interface StorageUnit extends Entity {
  brand: Brand
  quality: Quality
  weight: number
}