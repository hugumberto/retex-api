import { CreateVehicleUseCase } from './create-vehicle-use-case';
import { GetAllVehiclesUseCase } from './get-all-vehicles-use-case';
import { UpdateVehicleUseCase } from './update-vehicle-use-case';

export const VEHICLE_USE_CASES = [
  CreateVehicleUseCase,
  GetAllVehiclesUseCase,
  UpdateVehicleUseCase,
];

export * from './create-vehicle-use-case';
export * from './get-all-vehicles-use-case';
export * from './update-vehicle-use-case';
