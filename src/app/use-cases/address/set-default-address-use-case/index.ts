import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface SetDefaultAddressParam {
  userId: string;
  addressId: string;
}

@Injectable()
export class SetDefaultAddressUseCase implements IUseCase<SetDefaultAddressParam, Address> {
  constructor(
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
  ) { }

  async call(param: SetDefaultAddressParam): Promise<Address> {
    const address = await this.addressRepository.findOne({ id: param.addressId });
    if (!address || address.userId !== param.userId) {
      throw new NotFoundException('Endereço não encontrado');
    }

    await this.addressRepository.unsetDefault(param.userId);
    const [updated] = await this.addressRepository.update(
      { id: param.addressId } as Partial<Address>,
      { isDefault: true } as Partial<Address>,
    );
    return updated;
  }
}
