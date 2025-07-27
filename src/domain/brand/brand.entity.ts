import { Entity } from "../interfaces/entity.interface"

export interface Brand extends Entity {
  name: string
  manual: boolean
}