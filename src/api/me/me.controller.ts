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
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Request } from 'express';
import { CreateAddressUseCase } from '../../app/use-cases/address/create-address-use-case';
import { DeleteAddressUseCase } from '../../app/use-cases/address/delete-address-use-case';
import { GetUserAddressesUseCase } from '../../app/use-cases/address/get-user-addresses-use-case';
import { SetDefaultAddressUseCase } from '../../app/use-cases/address/set-default-address-use-case';
import { GetUserPackagesUseCase } from '../../app/use-cases/package';
import { UpdateMePasswordUseCase, UpdateUserUseCase } from '../../app/use-cases/user';
import { Address } from '../../domain/address/address.entity';
import { Package } from '../../domain/package/package.entity';
import { User } from '../../domain/user/user.entity';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateMeAddressDto {
  @IsString() @IsNotEmpty() @MaxLength(255) street: string;
  @IsString() @IsNotEmpty() @MaxLength(20) number: string;
  @IsString() @IsOptional() @MaxLength(255) complement?: string;
  @IsString() @IsNotEmpty() @MaxLength(255) city: string;
  @IsString() @IsOptional() @MaxLength(255) cityDivision?: string;
  @IsString() @IsOptional() @MaxLength(255) country?: string;
  @IsString() @IsOptional() @MaxLength(255) countryDivision?: string;
  @IsString() @IsNotEmpty() @MaxLength(20) zipCode: string;
  @IsString() @IsOptional() @Matches(/^(-?\d+(\.\d+)?)?$/, { message: 'lat deve ser um número' }) lat?: string;
  @IsString() @IsOptional() @Matches(/^(-?\d+(\.\d+)?)?$/, { message: 'long deve ser um número' }) long?: string;
  @IsBoolean() @IsOptional() isDefault?: boolean;
}

class UpdateMeDto {
  @IsString() @IsNotEmpty() contactPhone: string;
}

class UpdateMePasswordDto {
  @IsString() @IsNotEmpty() currentPassword: string;
  @IsString() @IsNotEmpty() @MinLength(8) newPassword: string;
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
    private readonly getUserPackagesUseCase: GetUserPackagesUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updateMePasswordUseCase: UpdateMePasswordUseCase,
  ) {}

  @Patch()
  @ApiOperation({ summary: 'Atualizar dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  updateMe(
    @Req() req: Request,
    @Body() dto: UpdateMeDto,
  ): Promise<Omit<User, 'password'>> {
    const { sub } = req['user'] as JwtPayload;
    return this.updateUserUseCase.call({ id: sub, data: { contactPhone: dto.contactPhone } });
  }

  @Patch('password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Alterar senha do usuário autenticado' })
  @ApiResponse({ status: 204, description: 'Senha atualizada' })
  updatePassword(
    @Req() req: Request,
    @Body() dto: UpdateMePasswordDto,
  ): Promise<void> {
    const { sub } = req['user'] as JwtPayload;
    return this.updateMePasswordUseCase.call({ userId: sub, currentPassword: dto.currentPassword, newPassword: dto.newPassword });
  }

  @Get('packages')
  @ApiOperation({ summary: 'Listar solicitações de coleta do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de pacotes', type: Array })
  getMyPackages(@Req() req: Request): Promise<Package[]> {
    const { sub } = req['user'] as JwtPayload;
    return this.getUserPackagesUseCase.call({ userId: sub });
  }

  @Get('address')
  @ApiOperation({ summary: 'Listar endereços do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de endereços', type: Array })
  getAddresses(@Req() req: Request): Promise<Address[]> {
    const { sub } = req['user'] as JwtPayload;
    return this.getUserAddressesUseCase.call(sub);
  }

  @Post('address')
  @ApiOperation({ summary: 'Adicionar endereço ao usuário autenticado' })
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
  @ApiResponse({ status: 200, description: 'Endereço padrão atualizado', type: Object })
  setDefault(
    @Req() req: Request,
    @Param('addrId') addressId: string,
  ): Promise<Address> {
    const { sub } = req['user'] as JwtPayload;
    return this.setDefaultAddressUseCase.call({ userId: sub, addressId });
  }

  @Delete('address/:addrId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover endereço do usuário autenticado' })
  @ApiResponse({ status: 204, description: 'Endereço removido' })
  deleteAddress(
    @Req() req: Request,
    @Param('addrId') addressId: string,
  ): Promise<void> {
    const { sub } = req['user'] as JwtPayload;
    return this.deleteAddressUseCase.call({ userId: sub, addressId });
  }
}
