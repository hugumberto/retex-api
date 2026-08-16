import { Address } from '../address/address.entity';
import { Company } from '../company/company.entity';
import { Entity } from '../interfaces/entity.interface';
import { Item } from '../item/item.entity';
import { Route } from '../route/route.entity';
import { User } from '../user/user.entity';

export interface CollectionRequest extends Entity {
  status: CollectionRequestStatus;
  // Código amigável (`ano-XXXXXX`) usado como referência da solicitação de
  // recolha no email ao utilizador e na listagem.
  friendlyCode?: string | null;
  // Quem pediu. Numa solicitação de empresa é o colaborador, não a empresa —
  // o rasto de quem pediu preserva-se.
  user: User;
  // Empresa da solicitação. NULL = particular. É o sinal que distingue os dois
  // na listagem e na construção de rotas.
  companyId?: string | null;
  company?: Company | null;
  route?: Route;
  weight?: number;
  estimatedBags?: number;
  address?: Address;
  addressId?: string;
  items?: Item[];
  collectionConfirmationToken?: string | null;
  collectionConfirmedAt?: Date | null;
  // Momento em que o lembrete da véspera foi enviado. NULL = ainda não enviado;
  // limpar o campo permite reenviar o lembrete.
  collectionReminderSentAt?: Date | null;
  // Nº de sacos gerados para esta solicitação na entrada da rota em IN_TRANSIT.
  bagsGenerated?: number;
  // Motivo do cancelamento (comentário do motorista na recolha).
  cancellationReason?: string | null;
}

export enum CollectionRequestStatus {
  CREATED = 'CREATED',
  // Cliente confirmou a recolha pelo email; não pode mais ser cancelada.
  CONFIRMED = 'CONFIRMED',
  OUT_OF_ZONE = 'OUT_OF_ZONE',
  WAITING_FOR_COLLECTION = 'WAITING_FOR_COLLECTION',
  COLLECTED = 'COLLECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  IN_HOUSE = 'IN_HOUSE',
  CANCELLED = 'CANCELLED',
  SCREENING = 'SCREENING',
  STOCKED = 'STOCKED',
}
