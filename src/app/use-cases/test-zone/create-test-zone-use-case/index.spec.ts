import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { CreateTestZoneUseCase } from '.';

describe('CreateTestZoneUseCase', () => {
  const zoneRepo = mock<ITestZoneRepository>();
  const addressRepo = mock<IAddressRepository>();
  const sanitization = mock<ISanitizationService>();
  let useCase: CreateTestZoneUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateTestZoneUseCase,
        { provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY, useValue: zoneRepo },
        { provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY, useValue: addressRepo },
        { provide: SERVICE_TOKENS.SANITIZATION_SERVICE, useValue: sanitization },
      ],
    }).compile();
    useCase = module.get(CreateTestZoneUseCase);
    sanitization.sanitizeString.mockImplementation((v: string) => v);
  });

  it('rejects an existing zone for the city', async () => {
    zoneRepo.findByCity.mockResolvedValue({ id: 'z0', city: 'Lisboa' } as TestZone);
    await expect(useCase.call({ city: 'Lisboa' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates the zone and flips matching addresses in-zone', async () => {
    zoneRepo.findByCity.mockResolvedValue(null);
    zoneRepo.create.mockResolvedValue({ id: 'z1', city: 'Lisboa' } as TestZone);
    await useCase.call({ city: 'Lisboa' });
    expect(zoneRepo.create).toHaveBeenCalledWith({ city: 'Lisboa' });
    expect(addressRepo.updateServiceZoneByCity).toHaveBeenCalledWith('Lisboa', true);
  });
});
