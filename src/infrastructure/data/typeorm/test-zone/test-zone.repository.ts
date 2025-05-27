import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { testZoneSchema } from './test-zone.schema';

@Injectable()
export class TestZoneRepository
  extends BaseRepository<TestZone>
  implements ITestZoneRepository
{
  constructor(
    @InjectRepository(testZoneSchema)
    testZoneRepository: Repository<TestZone>,
  ) {
    super(testZoneRepository);
  }

  async findByCity(city: string): Promise<TestZone | null> {
    const testZone = await this.repository.findOne({
      where: { city },
    });
    return testZone || null;
  }
} 