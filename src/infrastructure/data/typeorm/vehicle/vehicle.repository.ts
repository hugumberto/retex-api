import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { Vehicle } from '../../../../domain/vehicle/vehicle.entity';
import { IVehicleRepository } from '../../../../domain/vehicle/vehicle.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { vehicleSchema } from './vehicle.schema';

@Injectable()
export class VehicleRepository
  extends BaseRepository<Vehicle>
  implements IVehicleRepository
{
  constructor(
    @InjectRepository(vehicleSchema)
    vehicleRepository: Repository<Vehicle>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(vehicleRepository, localStorageService);
  }

  async findByPlate(plate: string): Promise<Vehicle | null> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('vehicle')
      .where('UPPER(TRIM(vehicle.plate)) = UPPER(TRIM(:plate))', { plate })
      .getOne();
  }
}
