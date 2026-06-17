import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRepository } from '../../../../domain/user/user.repository';
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
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
  ) { }

  async call(param: CreateAddressDto): Promise<Address> {
    const user = await this.userRepository.findOne({ id: param.userId });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    if (param.isDefault) {
      await this.addressRepository.unsetDefault(param.userId);
    }

    return this.addressRepository.create({
      userId: param.userId,
      street: param.street,
      number: param.number,
      complement: param.complement,
      city: param.city,
      cityDivision: param.cityDivision,
      country: param.country,
      countryDivision: param.countryDivision,
      zipCode: this.sanitizationService.sanitizeNumericString(param.zipCode),
      lat: parseFloat(param.lat),
      long: parseFloat(param.long),
      isDefault: param.isDefault ?? false,
    });
  }
}
