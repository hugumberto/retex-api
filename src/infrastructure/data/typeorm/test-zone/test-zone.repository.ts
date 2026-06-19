import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { testZoneSchema } from './test-zone.schema';

@Injectable()
export class TestZoneRepository
  extends BaseRepository<TestZone>
  implements ITestZoneRepository {
  constructor(
    @InjectRepository(testZoneSchema)
    testZoneRepository: Repository<TestZone>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(testZoneRepository, localStorageService);
  }

  async findByCity(city: string): Promise<TestZone | null> {
    const repository = await this.getRepository();
    const testZone = await repository.findOne({
      where: { city },
    });
    return testZone || null;
  }

  async findAll(): Promise<TestZone[]> {
    const repository = await this.getRepository();
    return repository.find({ order: { createdAt: 'DESC' } });
  }
}