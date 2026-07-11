import { IRepository } from '../interfaces/repository.interface';
import { QrCode } from './qr-code.entity';

export interface IQrCodeRepository extends IRepository<QrCode> {
  // Hard delete dos códigos não utilizados criados antes de `olderThan`.
  // Retorna a quantidade removida.
  deleteExpiredUnused(olderThan: Date): Promise<number>;

  // Todos os códigos gerados para uma rota (para impressão).
  findByRoute(routeId: string): Promise<QrCode[]>;

  // Hard delete dos códigos da rota que não foram utilizados (used_at IS NULL).
  // Retorna a quantidade removida.
  deleteUnusedByRoute(routeId: string): Promise<number>;
}
