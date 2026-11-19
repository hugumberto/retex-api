import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from '../create-vehicle-use-case/create-vehicle.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
