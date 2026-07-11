import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IGeocodingService } from '../../../services/interfaces/geocoding.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { CreateAddressUseCase } from '.';

describe('CreateAddressUseCase', () => {
  const addressRepo = mock<IAddressRepository>();
  const userRepo = mock<IUserRepository>();
  const testZoneRepo = mock<ITestZoneRepository>();
  const sanitization = mock<ISanitizationService>();
  const geocoding = mock<IGeocodingService>();
  let useCase: CreateAddressUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateAddressUseCase,
        { provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY, useValue: addressRepo },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepo },
        { provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY, useValue: testZoneRepo },
        { provide: SERVICE_TOKENS.SANITIZATION_SERVICE, useValue: sanitization },
        { provide: SERVICE_TOKENS.GEOCODING_SERVICE, useValue: geocoding },
      ],
    }).compile();
    useCase = module.get(CreateAddressUseCase);
    sanitization.sanitizeString.mockImplementation((v: string) => v);
    sanitization.sanitizeNumericString.mockReturnValue('1000');
    sanitization.sanitizeCoordinate.mockReturnValue(0);
    geocoding.geocode.mockResolvedValue(null);
  });

  const param = {
    userId: 'u1', street: 'R', number: '1', city: 'Lisboa', zipCode: '1000-001',
  } as any;

  it('throws when the user does not exist', async () => {
    userRepo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(NotFoundException);
  });

  it('creates the address flagged in-zone when the city is a service zone', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'u1' } as User);
    addressRepo.findByUser.mockResolvedValue([]);
    testZoneRepo.findByCity.mockResolvedValue({ id: 'z1', city: 'Lisboa' } as any);
    addressRepo.create.mockResolvedValue({ id: 'a1' } as Address);

    await useCase.call(param);

    expect(addressRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isInServiceZone: true }),
    );
  });

  it('geocodes the address when the client sends no coordinates', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'u1' } as User);
    addressRepo.findByUser.mockResolvedValue([]);
    testZoneRepo.findByCity.mockResolvedValue(undefined);
    addressRepo.create.mockResolvedValue({ id: 'a1' } as Address);
    geocoding.geocode.mockResolvedValue({ lat: 38.7, long: -9.1 });

    await useCase.call(param);

    expect(geocoding.geocode).toHaveBeenCalled();
    expect(addressRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 38.7, long: -9.1 }),
    );
  });
});
