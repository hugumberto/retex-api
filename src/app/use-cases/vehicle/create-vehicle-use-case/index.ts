import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Vehicle } from '../../../../domain/vehicle/vehicle.entity';
import { IVehicleRepository } from '../../../../domain/vehicle/vehicle.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateVehicleDto } from './create-vehicle.dto';

export { CreateVehicleDto };

// Matrícula normalizada: maiúsculas e sem espaços à volta ("aa-00-bb " → "AA-00-BB").
export const normalizePlate = (plate: string) => plate.trim().toUpperCase();

@Injectable()
export class CreateVehicleUseCase implements IUseCase<CreateVehicleDto, Vehicle> {
  constructor(
    @Inject(DOMAIN_TOKENS.VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async call(param: CreateVehicleDto): Promise<Vehicle> {
    const plate = normalizePlate(param.plate);
    if (await this.vehicleRepository.findByPlate(plate)) {
      throw new ConflictException('errors.vehicle.duplicatePlate');
    }
    return this.vehicleRepository.create({
      plate,
      name: param.name.trim(),
      capacityBags: param.capacityBags,
      active: param.active ?? true,
    });
  }
}
