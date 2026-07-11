import { Address } from '../address/address.entity';
import { Entity } from '../interfaces/entity.interface';
import { Item } from '../item/item.entity';
import { Route } from '../route/route.entity';
import { User } from '../user/user.entity';

export interface Package extends Entity {
  status: PackageStatus;
  // Código amigável (`ano-XXXXXX`) usado como referência da solicitação de
  // recolha no email ao utilizador e na listagem.
  friendlyCode?: string | null;
  user: User;
  route?: Route;
  weight?: number;
  estimatedVolumes?: number;
  address?: Address;
  addressId?: string;
  items?: Item[];
  collectionConfirmationToken?: string | null;
  collectionConfirmedAt?: Date | null;
  // Nº de QR codes gerados para esta solicitação na entrada da rota em IN_TRANSIT.
  qrCodesGenerated?: number;
  // Motivo do cancelamento (comentário do motorista na recolha).
  cancellationReason?: string | null;
}

export enum PackageStatus {
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
