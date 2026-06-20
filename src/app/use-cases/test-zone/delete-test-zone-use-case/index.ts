import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class DeleteTestZoneUseCase implements IUseCase<{ id: string }, void> {
  constructor(
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
    @Inject(DOMAIN_TOKENS.ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
  ) {}

  async call(param: { id: string }): Promise<void> {
    const zone = await this.testZoneRepository.findOne({ id: param.id } as Partial<TestZone>);
    if (!zone) {
      throw new NotFoundException('Zona não encontrada');
    }

    await this.testZoneRepository.delete({ id: param.id } as Partial<TestZone>);
    await this.addressRepository.updateServiceZoneByCity(zone.city, false);
  }
}
