import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../app/use-cases/user/create-user-use-case';
import { CreateUserDto } from '../../app/use-cases/user/create-user-use-case/create-user.dto';
import { GetUserByIdUseCase } from '../../app/use-cases/user/get-user-by-id-use-case';
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

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
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
}
