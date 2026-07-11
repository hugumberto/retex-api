import { Entity } from "../interfaces/entity.interface"

export interface QrCode extends Entity {
  token: string
  friendlyCode: string
  batchId: string
  usedAt?: Date | null
  packageId?: string | null
  // Rota que gerou o código (pool da rota). Preenchido na entrada em IN_TRANSIT.
  routeId?: string | null
  // Peso do volume, informado na triagem.
  weight?: number | null
  // Momento em que o volume foi processado na triagem.
  processedAt?: Date | null
}
