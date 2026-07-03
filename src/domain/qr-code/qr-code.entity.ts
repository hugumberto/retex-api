import { Entity } from "../interfaces/entity.interface"

export interface QrCode extends Entity {
  token: string
  friendlyCode: string
  batchId: string
  usedAt?: Date | null
  packageId?: string | null
}
