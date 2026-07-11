import { Entity } from "../interfaces/entity.interface";
import { Package } from "../package/package.entity";
import { User } from "../user/user.entity";

export enum CollectionInterval {
  MORNING = '09:00 - 13:00',
  AFTERNOON = '13:00 - 17:00',
  EVENING = '17:00 - 21:00',
}

export interface Route extends Entity {
  status: RouteStatus
  // Código amigável (`ano-XXXXXX`) usado como referência da rota na impressão.
  friendlyCode?: string | null
  // Intervalo de horário da recolha (informado no email de confirmação).
  collectionInterval?: CollectionInterval | null
  driver: User
  packages: Package[]
  startDate: Date
  endDate?: Date
  // Campos computados na listagem (loadRelationCountAndMap), não são colunas.
  packagesCount?: number
  // Nº de pacotes cuja recolha já foi confirmada pelo cliente.
  confirmedCount?: number
}

export enum RouteStatus {
  DRAFTING = 'DRAFTING',
  CREATED = 'CREATED',
  // Todas as solicitações confirmaram a recolha; a rota está pronta para iniciar.
  WAITING_TO_START = 'WAITING_TO_START',
  IN_TRANSIT = 'IN_TRANSIT',
  FINISHED = 'FINISHED',
}