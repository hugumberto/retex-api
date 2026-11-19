import { DashboardScope } from '../collection-request/collection-request.repository';
import { DateRange } from '../dashboard/date-range';
import { IRepository } from '../interfaces/repository.interface';
import { Item } from './item.entity';

export type ItemDimension = 'condition' | 'destination' | 'category' | 'season' | 'type';

export interface ItemDimensionCount {
  key: string;
  count: number;
  quantity: number;
}

export interface ItemBrandCount {
  brand: string;
  count: number;
  quantity: number;
}

/** Pedido à espera de triagem (ou a meio), para a fila do posto. */
export interface TriageQueueEntry {
  id: string;
  code: string | null;
  status: string;
  clientName: string | null;
  bags: number;
  bagsProcessed: number;
  /** Primeiro saco lido pelo motorista. */
  collectedAt: Date | null;
}

export interface IItemRepository extends IRepository<Item> {
  /** Pedidos recolhidos, em armazém ou em triagem: os a meio primeiro, depois os mais antigos. */
  triageQueue(limit: number): Promise<TriageQueueEntry[]>;
  /** Peças e pedidos triados por um operador desde `since`. */
  operatorStats(operatorId: string, since: Date): Promise<{ pieces: number; requests: number }>;
  /** Categorias com mais peças registadas, da mais usada para a menos. */
  topCategories(limit: number): Promise<string[]>;

  findByIds(ids: string[]): Promise<Item[]>;
  findByCollectionRequestId(collectionRequestId: string): Promise<Item[]>;
  /** Quantos itens estão atribuídos a um saco. Usado para impedir fechar um saco vazio. */
  countByBagId(bagId: string): Promise<number>;

  // Agregações para o dashboard (somente leitura). Sem `scope` agregam tudo.
  aggregateBy(
    dimension: ItemDimension,
    scope?: DashboardScope,
  ): Promise<ItemDimensionCount[]>;
  aggregateByBrand(scope?: DashboardScope): Promise<ItemBrandCount[]>;
  /** Peças (soma das quantidades) lançadas na triagem dentro do intervalo. */
  sumQuantityInRange(range: DateRange): Promise<number>;
}