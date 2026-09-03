import { DateRange } from '../dashboard/date-range';
import { IRepository } from '../interfaces/repository.interface';
import { CollectionRequestBag } from './collection-request-bag.entity';

export interface ICollectionRequestBagRepository
  extends IRepository<CollectionRequestBag> {
  // Hard delete dos sacos não utilizados criados antes de `olderThan`.
  // Retorna a quantidade removida.
  deleteExpiredUnused(olderThan: Date): Promise<number>;

  // Todos os sacos gerados para uma rota (para impressão).
  findByRoute(routeId: string): Promise<CollectionRequestBag[]>;

  // Hard delete dos sacos da rota que não foram utilizados (used_at IS NULL).
  // Retorna a quantidade removida.
  deleteUnusedByRoute(routeId: string): Promise<number>;

  // Quadro de atividade do dashboard. Contam-se solicitações distintas, e não
  // sacos: uma recolha ou uma triagem é o que se fez a um cliente, mesmo que
  // tenha rendido sete sacos.
  /** Solicitações com pelo menos um saco vinculado (recolhido) no intervalo. */
  countRequestsCollectedInRange(range: DateRange): Promise<number>;
  /** Solicitações com pelo menos um saco processado na triagem no intervalo. */
  countRequestsTriagedInRange(range: DateRange): Promise<number>;
}
