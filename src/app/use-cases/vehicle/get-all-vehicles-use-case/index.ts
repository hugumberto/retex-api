import { Inject, Injectable } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Vehicle } from '../../../../domain/vehicle/vehicle.entity';
import { IVehicleRepository } from '../../../../domain/vehicle/vehicle.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetAllVehiclesUseCase implements IUseCase<void, Vehicle[]> {
  constructor(
    @Inject(DOMAIN_TOKENS.VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  // Ativos primeiro, depois por matrícula.
  async call(): Promise<Vehicle[]> {
    const vehicles = await this.vehicleRepository.find({});
    return [...vehicles].sort(
      (a, b) => Number(b.active) - Number(a.active) || a.plate.localeCompare(b.plate),
    );
  }
}
