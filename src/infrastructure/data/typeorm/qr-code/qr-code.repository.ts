import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { qrCodeSchema } from './qr-code.schema';

@Injectable()
export class QrCodeRepository
  extends BaseRepository<QrCode>
  implements IQrCodeRepository
{
  constructor(
    @InjectRepository(qrCodeSchema)
    qrCodeRepository: Repository<QrCode>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(qrCodeRepository, localStorageService);
  }

  async deleteExpiredUnused(olderThan: Date): Promise<number> {
    const repository = await this.getRepository();
    const result = await repository
      .createQueryBuilder()
      .delete()
      .where('used_at IS NULL')
      .andWhere('created_at < :olderThan', { olderThan })
      .execute();
    return result.affected ?? 0;
  }

  async findByRoute(routeId: string): Promise<QrCode[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('qr_code')
      .where('qr_code.route_id = :routeId', { routeId })
      .orderBy('qr_code.createdAt', 'ASC')
      .getMany();
  }

  async deleteUnusedByRoute(routeId: string): Promise<number> {
    const repository = await this.getRepository();
    const result = await repository
      .createQueryBuilder()
      .delete()
      .where('route_id = :routeId', { routeId })
      .andWhere('used_at IS NULL')
      .execute();
    return result.affected ?? 0;
  }
}
