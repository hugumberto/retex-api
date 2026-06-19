import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Request } from 'express';
import { CreateAddressUseCase } from '../../app/use-cases/address/create-address-use-case';
import { DeleteAddressUseCase } from '../../app/use-cases/address/delete-address-use-case';
import { GetUserAddressesUseCase } from '../../app/use-cases/address/get-user-addresses-use-case';
import { SetDefaultAddressUseCase } from '../../app/use-cases/address/set-default-address-use-case';
import { Address } from '../../domain/address/address.entity';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateMeAddressDto {
  @IsString() @IsNotEmpty() street: string;
  @IsString() @IsNotEmpty() number: string;
  @IsString() @IsOptional() complement?: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsOptional() cityDivision?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() countryDivision?: string;
  @IsString() @IsNotEmpty() zipCode: string;
  @IsString() @IsOptional() lat?: string;
  @IsString() @IsOptional() long?: string;
  @IsBoolean() @IsOptional() isDefault?: boolean;
}

@ApiTags('me')
@Controller('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeController {
  constructor(
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly getUserAddressesUseCase: GetUserAddressesUseCase,
    private readonly setDefaultAddressUseCase: SetDefaultAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
  ) {}

  @Get('address')
  @ApiOperation({ summary: 'Listar endereços do utilizador autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de endereços', type: Array })
  getAddresses(@Req() req: Request): Promise<Address[]> {
    const { sub } = req['user'] as JwtPayload;
    return this.getUserAddressesUseCase.call(sub);
  }

  @Post('address')
  @ApiOperation({ summary: 'Adicionar endereço ao utilizador autenticado' })
  @ApiResponse({ status: 201, description: 'Endereço criado', type: Object })
  createAddress(
    @Req() req: Request,
    @Body() dto: CreateMeAddressDto,
  ): Promise<Address> {
    const { sub } = req['user'] as JwtPayload;
    return this.createAddressUseCase.call({ ...dto, userId: sub });
  }

  @Patch('address/:addrId/default')
  @ApiOperation({ summary: 'Definir endereço como padrão' })
  @ApiResponse({ status: 200, description: 'Endereço padrão actualizado', type: Object })
  setDefault(
    @Req() req: Request,
    @Param('addrId') addressId: string,
  ): Promise<Address> {
    const { sub } = req['user'] as JwtPayload;
    return this.setDefaultAddressUseCase.call({ userId: sub, addressId });
  }

  @Delete('address/:addrId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover endereço do utilizador autenticado' })
  @ApiResponse({ status: 204, description: 'Endereço removido' })
  deleteAddress(
    @Req() req: Request,
    @Param('addrId') addressId: string,
  ): Promise<void> {
    const { sub } = req['user'] as JwtPayload;
    return this.deleteAddressUseCase.call({ userId: sub, addressId });
  }
}
