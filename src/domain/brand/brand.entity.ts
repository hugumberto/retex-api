import { Entity } from "../interfaces/entity.interface"

export interface Brand extends Entity {
  name: string
  manual: boolean
  // Marca premium (indicador informativo nos relatórios da triagem).
  premium: boolean
}