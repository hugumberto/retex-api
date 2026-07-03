import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IGeocodingService } from '../../../services/interfaces/geocoding.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateAddressDto } from './create-address.dto';

@Injectable()
export class CreateAddressUseCase implements IUseCase<CreateAddressDto, Address> {
  constructor(
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
    @Inject(SERVICE_TOKENS.GEOCODING_SERVICE)
    private readonly geocodingService: IGeocodingService,
  ) { }

  async call(param: CreateAddressDto): Promise<Address> {
    const user = await this.userRepository.findOne({ id: param.userId });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    const existingAddresses = await this.addressRepository.findByUser(param.userId);
    const normalizedZip = this.sanitizationService.sanitizeNumericString(param.zipCode);
    const isDuplicate = existingAddresses.some(
      (a) =>
        a.street.toLowerCase() === param.street.toLowerCase() &&
        a.number.toLowerCase() === param.number.toLowerCase() &&
        a.zipCode === normalizedZip,
    );
    if (isDuplicate) {
      throw new ConflictException('Já existe um endereço com esta morada');
    }

    if (param.isDefault) {
      await this.addressRepository.unsetDefault(param.userId);
    }

    const sanitizedCity = this.sanitizationService.sanitizeString(param.city);
    const testZone = await this.testZoneRepository.findByCity(sanitizedCity);

    const parsedLat = param.lat ? this.sanitizationService.sanitizeCoordinate(param.lat) : 0;
    const parsedLong = param.long ? this.sanitizationService.sanitizeCoordinate(param.long) : 0;
    let lat = isNaN(parsedLat) ? 0 : parsedLat;
    let long = isNaN(parsedLong) ? 0 : parsedLong;

    // Sem coordenadas válidas do cliente → geocodificar pelo endereço.
    if (lat === 0 && long === 0) {
      const geocoded = await this.geocodingService.geocode({
        street: param.street,
        number: param.number,
        city: param.city,
        zipCode: param.zipCode,
      });
      if (geocoded) {
        lat = geocoded.lat;
        long = geocoded.long;
      }
    }

    return this.addressRepository.create({
      userId: param.userId,
      street: param.street,
      number: param.number,
      complement: param.complement,
      city: param.city,
      cityNormalized: sanitizedCity,
      cityDivision: param.cityDivision ?? '',
      country: param.country ?? '',
      countryDivision: param.countryDivision ?? '',
      zipCode: this.sanitizationService.sanitizeNumericString(param.zipCode),
      lat,
      long,
      isDefault: param.isDefault ?? false,
      isInServiceZone: !!testZone,
    });
  }
}
