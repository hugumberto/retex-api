import { Inject, Injectable } from '@nestjs/common';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetAllTestZonesUseCase implements IUseCase<void, TestZone[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
  ) {}

  async call(): Promise<TestZone[]> {
    return this.testZoneRepository.findAll();
  }
}
