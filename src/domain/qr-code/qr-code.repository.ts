import { IRepository } from '../interfaces/repository.interface';
import { QrCode } from './qr-code.entity';

export interface IQrCodeRepository extends IRepository<QrCode> {
  // Hard delete dos códigos não utilizados criados antes de `olderThan`.
  // Retorna a quantidade removida.
  deleteExpiredUnused(olderThan: Date): Promise<number>;
}
