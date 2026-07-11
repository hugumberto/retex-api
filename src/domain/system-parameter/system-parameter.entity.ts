import { Entity } from "../interfaces/entity.interface"

export interface SystemParameter extends Entity {
  // Dias antes da coleta em que o cliente ainda pode confirmar.
  collectionConfirmationDeadlineDays: number
  // Percentual extra (threshold) de QR codes gerados sobre os volumes informados.
  qrCodeThresholdPercentage: number
}
