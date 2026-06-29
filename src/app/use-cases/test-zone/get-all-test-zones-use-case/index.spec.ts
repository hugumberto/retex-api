import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllTestZonesUseCase } from '.';

describe('GetAllTestZonesUseCase', () => {
  const zoneRepo = mock<ITestZoneRepository>();
  let useCase: GetAllTestZonesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllTestZonesUseCase,
        { provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY, useValue: zoneRepo },
      ],
    }).compile();
    useCase = module.get(GetAllTestZonesUseCase);
  });

  it('returns all zones', async () => {
    const zones = [{ id: 'z1' } as TestZone];
    zoneRepo.findAll.mockResolvedValue(zones);
    expect(await useCase.call()).toBe(zones);
  });
});
