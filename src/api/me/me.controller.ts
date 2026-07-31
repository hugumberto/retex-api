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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Request } from 'express';
import { CreateAddressUseCase } from '../../app/use-cases/address/create-address-use-case';
import { CreateAddressDto } from '../../app/use-cases/address/create-address-use-case/create-address.dto';
import { DeleteAddressUseCase } from '../../app/use-cases/address/delete-address-use-case';
import { GetUserAddressesUseCase } from '../../app/use-cases/address/get-user-addresses-use-case';
import { SetDefaultAddressUseCase } from '../../app/use-cases/address/set-default-address-use-case';
import { GetUserCollectionRequestsUseCase } from '../../app/use-cases/collection-request';
import { UpdateMePasswordUseCase, UpdateUserUseCase } from '../../app/use-cases/user';
import { Address } from '../../domain/address/address.entity';
import { CollectionRequest } from '../../domain/collection-request/collection-request.entity';
import { User } from '../../domain/user/user.entity';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Mesma morada do fluxo de admin, menos o `userId` — aqui vem do JWT.
class CreateMeAddressDto extends OmitType(CreateAddressDto, ['userId'] as const) {}

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
    private readonly getUserCollectionRequestsUseCase: GetUserCollectionRequestsUseCase,
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

  @Get('collection-requests')
  @ApiOperation({
    summary: 'Listar solicitações de recolha do utilizador autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de solicitações de recolha',
    type: Array,
  })
  getMyCollectionRequests(@Req() req: Request): Promise<CollectionRequest[]> {
    const { sub } = req['user'] as JwtPayload;
    return this.getUserCollectionRequestsUseCase.call({ userId: sub });
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
