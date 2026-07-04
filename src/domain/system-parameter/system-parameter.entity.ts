import { Entity } from "../interfaces/entity.interface"

export interface SystemParameter extends Entity {
  // Dias antes da coleta em que o cliente ainda pode confirmar.
  collectionConfirmationDeadlineDays: number
}
