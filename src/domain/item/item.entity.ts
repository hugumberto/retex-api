import { Brand } from "../brand/brand.entity"
import { Entity } from "../interfaces/entity.interface"
import { CollectionRequest } from "../collection-request/collection-request.entity"
import { CollectionRequestBag } from "../collection-request-bag/collection-request-bag.entity"
import { StorageUnit } from "../storage-unit/storage-unit.entity"
import { User } from "../user/user.entity"
import { Category } from "./item-category"

export interface Item extends Entity {
  collectionRequest: CollectionRequest
  storageUnit: StorageUnit
  quantity: number
  // Saco (com etiqueta QR) ao qual este item pertence, definido na triagem.
  bag?: CollectionRequestBag | null

  // Indicadores básicos: decidem o lote físico (ver `resolveStorageSlot`).
  // Só são obrigatórios para destinos reutilizáveis.
  destination: Destination
  sex?: Sex | null
  ageGroup?: AgeGroup | null
  season?: Season | null
  // Parte de cima / de baixo; derivada da categoria quando esta é informada.
  type?: Type | null

  // Indicadores informativos (relatórios e análises; não decidem o lote).
  category?: Category | null
  condition?: Condition | null
  brand?: Brand | null
  denim?: boolean | null
  material?: string | null
  color?: string | null
  size?: string | null
  // Operador que registou o item na triagem.
  operator?: User | null
}

// Estado da peça.
export enum Condition {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  REGULAR = "REGULAR",
}

// Destino / valorização da peça.
export enum Destination {
  REUSE = "REUSE",
  VINTAGE = "VINTAGE",
  RECONDITIONING = "RECONDITIONING",
  UPCYCLING = "UPCYCLING",
  STOCK_RESERVE = "STOCK_RESERVE",
  NON_REUSABLE = "NON_REUSABLE",
  // Não recolhemos, mas registamos para monitorizar; não vai para nenhum lote.
  ACCESSORY = "ACCESSORY",
}

// Destinos que vão para os lotes de reutilização (grupo × estação × parte).
export const REUSABLE_DESTINATIONS: Destination[] = [
  Destination.REUSE,
  Destination.VINTAGE,
  Destination.RECONDITIONING,
  Destination.UPCYCLING,
  Destination.STOCK_RESERVE,
]

export const isReusableDestination = (destination?: Destination | null): boolean =>
  !!destination && REUSABLE_DESTINATIONS.includes(destination)

export enum Type {
  UPPER_PART = "UPPER_PART",
  UNDER_PART = "UNDER_PART",
}

export enum Season {
  SUMMER = "SUMMER",
  WINTER = "WINTER",
}

export enum Sex {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum AgeGroup {
  ADULT = "ADULT",
  CHILD = "CHILD",
}
