import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateTestZoneDto } from './create-test-zone.dto';

@Injectable()
export class CreateTestZoneUseCase implements IUseCase<CreateTestZoneDto, TestZone> {
  constructor(
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
  ) {}

  async call(param: CreateTestZoneDto): Promise<TestZone> {
    const sanitizedCity = this.sanitizationService.sanitizeString(param.city);

    const existing = await this.testZoneRepository.findByCity(sanitizedCity);
    if (existing) {
      throw new ConflictException('Zona já existe para esta cidade');
    }

    const zone = await this.testZoneRepository.create({ city: sanitizedCity });
    await this.addressRepository.updateServiceZoneByCity(sanitizedCity, true);

    return zone;
  }
}
