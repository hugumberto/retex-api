import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AddRoleToUserUseCase } from '../../app/use-cases/user/add-role-to-user-use-case';
import { AddRoleToUserDto } from '../../app/use-cases/user/add-role-to-user-use-case/add-role-to-user.dto';
import { CreateSubUserUseCase } from '../../app/use-cases/user/create-sub-user-use-case';
import { CreateSubUserDto } from '../../app/use-cases/user/create-sub-user-use-case/create-sub-user.dto';
import { CreateUserUseCase } from '../../app/use-cases/user/create-user-use-case';
import { CreateUserDto } from '../../app/use-cases/user/create-user-use-case/create-user.dto';
import { DeactivateSubUserUseCase } from '../../app/use-cases/user/deactivate-sub-user-use-case';
import { GetAllUsersUseCase } from '../../app/use-cases/user/get-all-users-use-case';
import { GetSubUsersUseCase } from '../../app/use-cases/user/get-sub-users-use-case';
import { GetUserByIdUseCase } from '../../app/use-cases/user/get-user-by-id-use-case';
import { UpdateUserUseCase } from '../../app/use-cases/user/update-user-use-case';
import { UpdateUserDto } from '../../app/use-cases/user/update-user-use-case/update-user.dto';
import { Role } from '../../domain/user/user-roles.entity';
import { User } from '../../domain/user/user.entity';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
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
    private readonly createSubUserUseCase: CreateSubUserUseCase,
    private readonly getSubUsersUseCase: GetSubUsersUseCase,
    private readonly deactivateSubUserUseCase: DeactivateSubUserUseCase,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: Object })
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
  @ApiQuery({ name: 'parentId', required: false, type: String, description: 'Filtra sub-usuários por pai' })
  @ApiResponse({ status: 200, description: 'Lista de usuários', type: Array })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async getAllUsers(
    @Query('role') role?: Role,
    @Query('parentId') parentId?: string,
  ): Promise<Omit<User, 'password'>[]> {
    return this.getAllUsersUseCase.call({ role, parentId });
  }

  @Get('me/sub-users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar sub-usuários do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de sub-usuários', type: Array })
  async getSubUsers(@Req() req: Request): Promise<Omit<User, 'password'>[]> {
    const payload = req['user'] as JwtPayload;
    return this.getSubUsersUseCase.call(payload.sub);
  }

  @Post('me/sub-users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar sub-usuário para o usuário autenticado' })
  @ApiResponse({ status: 201, description: 'Sub-usuário criado com sucesso', type: Object })
  @ApiResponse({ status: 400, description: 'Sub-usuários não podem criar outros sub-usuários' })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  async createSubUser(
    @Req() req: Request,
    @Body() dto: CreateSubUserDto,
  ): Promise<Omit<User, 'password'>> {
    const payload = req['user'] as JwtPayload;
    const user = await this.createSubUserUseCase.call({ parentId: payload.sub, data: dto });
    const { password, ...rest } = user;
    return rest;
  }

  @Delete('me/sub-users/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desativar sub-usuário do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Sub-usuário desativado com sucesso', type: Object })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Sub-usuário não encontrado' })
  async deactivateSubUser(
    @Req() req: Request,
    @Param('id') subUserId: string,
  ): Promise<Omit<User, 'password'>> {
    const payload = req['user'] as JwtPayload;
    return this.deactivateSubUserUseCase.call({ parentId: payload.sub, subUserId });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado', type: Object })
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
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso', type: Object })
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
  @ApiOperation({ summary: 'Sincronizar roles do usuário (substitui as existentes pelas enviadas)' })
  @ApiResponse({ status: 200, description: 'Roles sincronizadas com sucesso', type: Object })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas ADMINs' })
  async addRoleToUser(
    @Param('id') userId: string,
    @Body() addRoleDto: AddRoleToUserDto,
  ): Promise<Omit<User, 'password'>> {
    return this.addRoleToUserUseCase.call({ userId, data: addRoleDto });
  }
}
