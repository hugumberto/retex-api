import { IRepository } from '../interfaces/repository.interface';
import { Vehicle } from './vehicle.entity';

export interface IVehicleRepository extends IRepository<Vehicle> {
  findByPlate(plate: string): Promise<Vehicle | null>;
}
