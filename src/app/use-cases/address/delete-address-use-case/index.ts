import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface DeleteAddressParam {
  userId: string;
  addressId: string;
}

@Injectable()
export class DeleteAddressUseCase implements IUseCase<DeleteAddressParam, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
  ) { }

  async call(param: DeleteAddressParam): Promise<void> {
    const address = await this.addressRepository.findOne({ id: param.addressId });
    if (!address || address.userId !== param.userId) {
      throw new NotFoundException('errors.address.notFound');
    }

    // Impede eliminar uma morada ainda usada por uma solicitação ativa —
    // evitaria referências pendentes (`address_id` a apontar para morada apagada).
    const inUse = await this.collectionRequestRepository.existsActiveByAddress(
      param.addressId,
    );
    if (inUse) {
      throw new ConflictException('errors.address.deleteBlockedByActiveRequest',
      );
    }

    await this.addressRepository.delete({ id: param.addressId } as Partial<Address>);

    if (address.isDefault) {
      const remaining = await this.addressRepository.findByUser(param.userId);
      if (remaining.length > 0) {
        const mostRecent = remaining.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        await this.addressRepository.update(
          { id: mostRecent.id } as Partial<Address>,
          { isDefault: true } as Partial<Address>,
        );
      }
    }
  }
}
