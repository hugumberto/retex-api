import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddRoleToUserUseCase } from '../../app/use-cases/user/add-role-to-user-use-case';
import { AddRoleToUserDto } from '../../app/use-cases/user/add-role-to-user-use-case/add-role-to-user.dto';
import { CreateUserUseCase } from '../../app/use-cases/user/create-user-use-case';
import { CreateUserDto } from '../../app/use-cases/user/create-user-use-case/create-user.dto';
import { GetAllUsersUseCase } from '../../app/use-cases/user/get-all-users-use-case';
import { GetUserByIdUseCase } from '../../app/use-cases/user/get-user-by-id-use-case';
import { UpdateUserUseCase } from '../../app/use-cases/user/update-user-use-case';
import { UpdateUserDto } from '../../app/use-cases/user/update-user-use-case/update-user.dto';
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
    private readonly addRoleToUserUseCase: AddRoleToUserUseCase,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: Object
  })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.createUserUseCase.call(createUserDto);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiQuery({ name: 'role', required: false, enum: Role, description: 'Filtra usuários por role' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários',
    type: Array
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async getAllUsers(@Query('role') role?: Role): Promise<Omit<User, 'password'>[]> {
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
    type: Object
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async getUserById(@Param('id') id: string): Promise<Omit<User, 'password'>> {
    const user = await this.getUserByIdUseCase.call(id);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: Object
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email ou documento já em uso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<Omit<User, 'password'>> {
    return this.updateUserUseCase.call({ id, data: updateUserDto });
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sincronizar roles do usuário (substitui as existentes pelas enviadas)' })
  @ApiResponse({
    status: 200,
    description: 'Roles sincronizadas com sucesso',
    type: Object
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas ADMINs' })
  async addRoleToUser(
    @Param('id') userId: string,
    @Body() addRoleDto: AddRoleToUserDto
  ): Promise<Omit<User, 'password'>> {
    return this.addRoleToUserUseCase.call({ userId, data: addRoleDto });
  }
}
