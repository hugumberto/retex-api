import { Entity } from "../interfaces/entity.interface"
import { Item, Season, Type } from "../item/item.entity"

export enum StorageUnitStatus {
  ATIVO = "ATIVO",
  INATIVO = "INATIVO",
}

// Grupo do lote físico. NON_REUSABLE é o lote único sem estação nem parte.
export enum StorageGroup {
  MEN = "MEN",
  WOMEN = "WOMEN",
  CHILDREN = "CHILDREN",
  NON_REUSABLE = "NON_REUSABLE",
}

export interface StorageUnit extends Entity {
  // Código amigável (`ano-XXXXXX`) usado como referência na lista e na etiqueta.
  friendlyCode?: string | null
  group: StorageGroup
  // Nulos apenas no lote NON_REUSABLE.
  season?: Season | null
  type?: Type | null
  // Localização física (armazém / posição).
  location?: string | null
  status: StorageUnitStatus
  weight: number
  // Itens associados (relação inversa; usada para contar).
  items?: Item[]
  // Nº de itens associados a esta unidade de armazenamento (calculado).
  itemsCount?: number
}
