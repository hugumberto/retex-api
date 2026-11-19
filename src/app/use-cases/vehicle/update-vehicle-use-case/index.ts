import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Vehicle } from '../../../../domain/vehicle/vehicle.entity';
import { IVehicleRepository } from '../../../../domain/vehicle/vehicle.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { normalizePlate } from '../create-vehicle-use-case';
import { UpdateVehicleDto } from './update-vehicle.dto';

export { UpdateVehicleDto };

export interface UpdateVehicleParams {
  id: string;
  data: UpdateVehicleDto;
}

@Injectable()
export class UpdateVehicleUseCase implements IUseCase<UpdateVehicleParams, Vehicle> {
  constructor(
    @Inject(DOMAIN_TOKENS.VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async call({ id, data }: UpdateVehicleParams): Promise<Vehicle> {
    const existing = await this.vehicleRepository.findOne({ id });
    if (!existing) {
      throw new NotFoundException('errors.vehicle.notFound');
    }

    const patch: Partial<Vehicle> = { ...data };
    if (data.plate !== undefined) {
      patch.plate = normalizePlate(data.plate);
      const duplicate = await this.vehicleRepository.findByPlate(patch.plate);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('errors.vehicle.duplicatePlate');
      }
    }
    if (data.name !== undefined) patch.name = data.name.trim();

    const [updated] = await this.vehicleRepository.update({ id }, patch);
    return updated;
  }
}
