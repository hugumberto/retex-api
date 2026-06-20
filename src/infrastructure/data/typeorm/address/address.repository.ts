import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { addressSchema } from './address.schema';

@Injectable()
export class AddressRepository
  extends BaseRepository<Address>
  implements IAddressRepository {
  constructor(
    @InjectRepository(addressSchema)
    addressRepository: Repository<Address>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(addressRepository, localStorageService);
  }

  async findByUser(userId: string): Promise<Address[]> {
    return this.find({ userId } as Partial<Address>);
  }

  async unsetDefault(userId: string): Promise<void> {
    const addresses = await this.find({ userId, isDefault: true } as Partial<Address>);
    if (addresses.length > 0) {
      await this.update({ userId, isDefault: true } as Partial<Address>, { isDefault: false } as Partial<Address>);
    }
  }

  async updateServiceZoneByCity(sanitizedCity: string, value: boolean): Promise<void> {
    const repo = await this.getRepository();
    // Passar o schema (em vez de 'user_address' string) garante que o TypeORM
    // mapeia `isInServiceZone` -> coluna `is_in_service_zone`. Com o alvo-string
    // não havia metadata e o UPDATE referia uma coluna inexistente.
    await repo.createQueryBuilder()
      .update(addressSchema)
      .set({ isInServiceZone: value })
      // city_normalized é guardada já sanitizada (sem acentos, minúsculas), tal
      // como o argumento — assim cidades com acentos também casam.
      .where('city_normalized = :city', { city: sanitizedCity })
      .execute();
  }
}
