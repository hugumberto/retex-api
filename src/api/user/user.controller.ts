import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateAddressUseCase } from '../../app/use-cases/address/create-address-use-case';
import { CreateAddressDto } from '../../app/use-cases/address/create-address-use-case/create-address.dto';
import { DeleteAddressUseCase } from '../../app/use-cases/address/delete-address-use-case';
import { GetUserAddressesUseCase } from '../../app/use-cases/address/get-user-addresses-use-case';
import { SetDefaultAddressUseCase } from '../../app/use-cases/address/set-default-address-use-case';
import { AddRoleToUserUseCase } from '../../app/use-cases/user/add-role-to-user-use-case';
import { AddRoleToUserDto } from '../../app/use-cases/user/add-role-to-user-use-case/add-role-to-user.dto';
import { CreateUserUseCase } from '../../app/use-cases/user/create-user-use-case';
import { CreateUserDto } from '../../app/use-cases/user/create-user-use-case/create-user.dto';
import { GetAllUsersUseCase } from '../../app/use-cases/user/get-all-users-use-case';
import { GetUserByIdUseCase } from '../../app/use-cases/user/get-user-by-id-use-case';
import { RegisterUserUseCase } from '../../app/use-cases/user/register-user-use-case';
import { RegisterUserDto } from '../../app/use-cases/user/register-user-use-case/register-user.dto';
import { ResetUserPasswordUseCase } from '../../app/use-cases/user/reset-user-password-use-case';
import { ResetUserPasswordDto } from '../../app/use-cases/user/reset-user-password-use-case/reset-user-password.dto';
import { UpdateUserUseCase } from '../../app/use-cases/user/update-user-use-case';
import { UpdateUserDto } from '../../app/use-cases/user/update-user-use-case/update-user.dto';
import { Address } from '../../domain/address/address.entity';
import { Role } from '../../domain/user/user-roles.entity';
import { User } from '../../domain/user/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly resetUserPasswordUseCase: ResetUserPasswordUseCase,
    private readonly addRoleToUserUseCase: AddRoleToUserUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly getUserAddressesUseCase: GetUserAddressesUseCase,
    private readonly setDefaultAddressUseCase: SetDefaultAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registo público de utilizador (tipo sempre PERSON)',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilizador registado com sucesso',
    type: Object,
  })
  @ApiResponse({ status: 409, description: 'Email já em uso' })
  async registerUser(
    @Body() dto: RegisterUserDto,
  ): Promise<Omit<User, 'password'>> {
    return this.registerUserUseCase.call(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: Object,
  })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.createUserUseCase.call(createUserDto);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filtra usuários por role',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários',
    type: Array,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async getAllUsers(
    @Query('role') role?: Role,
  ): Promise<Omit<User, 'password'>[]> {
    return this.getAllUsersUseCase.call({ role });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async getUserById(@Param('id') id: string): Promise<Omit<User, 'password'>> {
    const user = await this.getUserByIdUseCase.call(id);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Put('reset-password')
  @ApiOperation({ summary: 'Resetar senha do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Senha atualizada com sucesso',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async resetUserPassword(
    @Body() resetUserPasswordDto: ResetUserPasswordDto,
  ): Promise<Omit<User, 'password'>> {
    return this.resetUserPasswordUseCase.call(resetUserPasswordDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email ou documento já em uso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    return this.updateUserUseCase.call({ id, data: updateUserDto });
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Sincronizar roles do usuário (substitui as existentes pelas enviadas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles sincronizadas com sucesso',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas ADMINs' })
  async addRoleToUser(
    @Param('id') userId: string,
    @Body() addRoleDto: AddRoleToUserDto,
  ): Promise<Omit<User, 'password'>> {
    return this.addRoleToUserUseCase.call({ userId, data: addRoleDto });
  }

  @Post(':id/address')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar endereço ao utilizador' })
  @ApiResponse({ status: 201, description: 'Endereço criado', type: Object })
  @ApiResponse({ status: 404, description: 'Utilizador não encontrado' })
  async createAddress(
    @Param('id') userId: string,
    @Body() dto: CreateAddressDto,
  ): Promise<Address> {
    return this.createAddressUseCase.call({ ...dto, userId });
  }

  @Get(':id/address')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar endereços do utilizador' })
  @ApiResponse({ status: 200, description: 'Lista de endereços', type: Array })
  async getUserAddresses(@Param('id') userId: string): Promise<Address[]> {
    return this.getUserAddressesUseCase.call(userId);
  }

  @Patch(':id/address/:addrId/default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Definir endereço como padrão' })
  @ApiResponse({
    status: 200,
    description: 'Endereço padrão atualizado',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async setDefaultAddress(
    @Param('id') userId: string,
    @Param('addrId') addressId: string,
  ): Promise<Address> {
    return this.setDefaultAddressUseCase.call({ userId, addressId });
  }

  @Delete(':id/address/:addrId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover endereço do utilizador' })
  @ApiResponse({ status: 204, description: 'Endereço removido' })
  @ApiResponse({ status: 404, description: 'Endereço não encontrado' })
  async deleteAddress(
    @Param('id') userId: string,
    @Param('addrId') addressId: string,
  ): Promise<void> {
    return this.deleteAddressUseCase.call({ userId, addressId });
  }
}
