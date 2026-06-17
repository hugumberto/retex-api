import { Inject, Injectable } from '@nestjs/common';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetUserAddressesUseCase implements IUseCase<string, Address[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
  ) { }

  async call(userId: string): Promise<Address[]> {
    return this.addressRepository.findByUser(userId);
  }
}
