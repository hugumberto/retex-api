import { Entity } from "../interfaces/entity.interface"

export interface CollectionRequestBag extends Entity {
  token: string
  friendlyCode: string
  batchId: string
  usedAt?: Date | null
  collectionRequestId?: string | null
  // Rota que gerou o saco (pool da rota). Preenchido na entrada em IN_TRANSIT.
  routeId?: string | null
  // Receção no armazém: quando o saco foi lido à chegada e o peso bruto.
  receivedAt?: Date | null
  receivedWeight?: number | null
  // Peso do saco, informado na triagem (pré-preenchido com o da receção).
  weight?: number | null
  // Momento em que o saco foi processado na triagem.
  processedAt?: Date | null
}
