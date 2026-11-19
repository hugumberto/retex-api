import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { DATE_ONLY_PATTERN } from '../../../../domain/dashboard/date-range';
import { RouteStatus } from '../../../../domain/route/route.entity';

export class GetAllRoutesDto {
  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @IsOptional()
  @IsString()
  @IsUUID()
  driverId?: string;

  // Rotas de um dia (vista "Rotas de hoje" do portal).
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'date deve ser uma data YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
} 