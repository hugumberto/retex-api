import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { Company } from '../../../../domain/company/company.entity';
import { ICompanyRepository } from '../../../../domain/company/company.repository';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IGeocodingService } from '../../../services/interfaces/geocoding.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateCompanyAddressDto } from './create-company-address.dto';

export interface CreateCompanyAddressParam {
  companyId: string;
  data: CreateCompanyAddressDto;
}

/**
 * Local de recolha de uma empresa.
 *
 * Fica na empresa e não em quem a criou: sobrevive à saída do colaborador e
 * qualquer membro pode pedir recolha nela.
 */
@Injectable()
export class CreateCompanyAddressUseCase
  implements IUseCase<CreateCompanyAddressParam, Address>
{
  constructor(
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(DOMAIN_TOKENS.COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
    @Inject(SERVICE_TOKENS.GEOCODING_SERVICE)
    private readonly geocodingService: IGeocodingService,
  ) { }

  async call({ companyId, data }: CreateCompanyAddressParam): Promise<Address> {
    const company = await this.companyRepository.findOne({
      id: companyId,
    } as Partial<Company>);
    if (!company) {
      throw new NotFoundException('errors.company.notFound');
    }

    const normalizedZip = this.sanitizationService.sanitizeNumericString(
      data.zipCode,
    );

    const existing = await this.addressRepository.find({
      companyId,
    } as Partial<Address>);
    const isDuplicate = existing.some(
      (a) =>
        a.street.toLowerCase() === data.street.toLowerCase() &&
        a.number.toLowerCase() === data.number.toLowerCase() &&
        a.zipCode === normalizedZip,
    );
    if (isDuplicate) {
      throw new ConflictException('errors.address.duplicate');
    }

    const sanitizedCity = this.sanitizationService.sanitizeString(data.city);
    const testZone = await this.testZoneRepository.findByCity(sanitizedCity);

    const parsedLat = data.lat
      ? this.sanitizationService.sanitizeCoordinate(data.lat)
      : 0;
    const parsedLong = data.long
      ? this.sanitizationService.sanitizeCoordinate(data.long)
      : 0;
    let lat = isNaN(parsedLat) ? 0 : parsedLat;
    let long = isNaN(parsedLong) ? 0 : parsedLong;

    // Sem coordenadas válidas do cliente → geocodificar pelo endereço, tal como
    // nas moradas pessoais (o mapa da construção de rotas depende disto).
    if (lat === 0 && long === 0) {
      const geocoded = await this.geocodingService.geocode({
        street: data.street,
        number: data.number,
        city: data.city,
        zipCode: data.zipCode,
      });
      if (geocoded) {
        lat = geocoded.lat;
        long = geocoded.long;
      }
    }

    return this.addressRepository.create({
      // O CHECK da BD garante que só um dos donos vem preenchido.
      userId: null,
      companyId,
      street: data.street,
      number: data.number,
      complement: data.complement,
      city: data.city,
      cityNormalized: sanitizedCity,
      cityDivision: data.cityDivision ?? '',
      country: data.country ?? '',
      countryDivision: data.countryDivision ?? '',
      zipCode: normalizedZip,
      lat,
      long,
      isDefault: false,
      isInServiceZone: !!testZone,
    } as Partial<Address>);
  }
}
