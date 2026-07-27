import { Entity } from "../interfaces/entity.interface"

export interface CollectionRequestBag extends Entity {
  token: string
  friendlyCode: string
  batchId: string
  usedAt?: Date | null
  collectionRequestId?: string | null
  // Rota que gerou o saco (pool da rota). Preenchido na entrada em IN_TRANSIT.
  routeId?: string | null
  // Peso do saco, informado na triagem.
  weight?: number | null
  // Momento em que o saco foi processado na triagem.
  processedAt?: Date | null
}
