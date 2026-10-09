import { AgeGroup, Destination, Item, Season, Sex, Type, isReusableDestination } from "../item/item.entity"
import { StorageGroup, StorageUnit, StorageUnitStatus } from "./storage-unit.entity"

/**
 * Combinação de indicadores básicos que identifica o lote físico:
 * 12 lotes de reutilização (grupo × estação × parte) + 1 não reutilizável.
 */
export interface StorageSlot {
  group: StorageGroup
  season: Season | null
  type: Type | null
}

/**
 * Lote onde a peça deve ser armazenada, ou `null` quando não vai para lote
 * nenhum (acessórios, ou peça reutilizável sem os indicadores básicos).
 */
export function resolveStorageSlot(
  item: Pick<Item, "destination" | "sex" | "ageGroup" | "season" | "type">,
): StorageSlot | null {
  if (item.destination === Destination.NON_REUSABLE) {
    return { group: StorageGroup.NON_REUSABLE, season: null, type: null }
  }

  if (!isReusableDestination(item.destination)) {
    return null
  }

  if (!item.sex || !item.ageGroup || !item.season || !item.type) {
    return null
  }

  // Criança é um só lote físico; o sexo fica registado só na peça.
  const group =
    item.ageGroup === AgeGroup.CHILD
      ? StorageGroup.CHILDREN
      : item.sex === Sex.MALE
        ? StorageGroup.MEN
        : StorageGroup.WOMEN

  return { group, season: item.season, type: item.type }
}

export function storageUnitMatchesSlot(unit: StorageUnit, slot: StorageSlot): boolean {
  return (
    unit.status === StorageUnitStatus.ATIVO &&
    unit.group === slot.group &&
    (unit.season ?? null) === slot.season &&
    (unit.type ?? null) === slot.type
  )
}

// Valida a combinação de um lote: NON_REUSABLE sem estação/parte; os demais com ambas.
export function isValidStorageSlot(slot: StorageSlot): boolean {
  if (slot.group === StorageGroup.NON_REUSABLE) {
    return slot.season == null && slot.type == null
  }
  return slot.season != null && slot.type != null
}
