import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { DeleteTestZoneUseCase } from '.';

describe('DeleteTestZoneUseCase', () => {
  const zoneRepo = mock<ITestZoneRepository>();
  const addressRepo = mock<IAddressRepository>();
  const sanitization = mock<ISanitizationService>();
  let useCase: DeleteTestZoneUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteTestZoneUseCase,
        { provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY, useValue: zoneRepo },
        { provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY, useValue: addressRepo },
        { provide: SERVICE_TOKENS.SANITIZATION_SERVICE, useValue: sanitization },
      ],
    }).compile();
    useCase = module.get(DeleteTestZoneUseCase);
    sanitization.sanitizeString.mockImplementation((v: string) => v);
  });

  it('throws when the zone does not exist', async () => {
    zoneRepo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'z1' })).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing zone', async () => {
    zoneRepo.findOne.mockResolvedValue({ id: 'z1', city: 'Lisboa' } as TestZone);
    await useCase.call({ id: 'z1' });
    expect(zoneRepo.delete).toHaveBeenCalledWith({ id: 'z1' });
  });
});
