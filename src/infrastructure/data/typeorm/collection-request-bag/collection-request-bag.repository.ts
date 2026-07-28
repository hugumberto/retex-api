import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { CollectionRequestBag } from '../../../../domain/collection-request-bag/collection-request-bag.entity';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { collectionRequestBagSchema } from './collection-request-bag.schema';

@Injectable()
export class CollectionRequestBagRepository
  extends BaseRepository<CollectionRequestBag>
  implements ICollectionRequestBagRepository
{
  constructor(
    @InjectRepository(collectionRequestBagSchema)
    collectionRequestBagRepository: Repository<CollectionRequestBag>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(collectionRequestBagRepository, localStorageService);
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

  async findByRoute(routeId: string): Promise<CollectionRequestBag[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('collectionRequestBag')
      .where('collectionRequestBag.route_id = :routeId', { routeId })
      .orderBy('collectionRequestBag.createdAt', 'ASC')
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
