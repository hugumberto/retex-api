import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtPayload, LoginResult, RefreshTokenResult } from '../../app/services/interfaces/auth.interface';
import { LoginUseCase } from '../../app/use-cases/auth/login-use-case';
import { LoginDto } from '../../app/use-cases/auth/login-use-case/login.dto';
import { LogoutUseCase } from '../../app/use-cases/auth/logout-use-case';
import { LogoutDto } from '../../app/use-cases/auth/logout-use-case/logout.dto';
import { RefreshTokenUseCase } from '../../app/use-cases/auth/refresh-token-use-case';
import { RefreshTokenDto } from '../../app/use-cases/auth/refresh-token-use-case/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: Object
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<LoginResult> {
    const result = await this.loginUseCase.call(loginDto);
    res.cookie('rt', result.refresh_token);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar tokens usando refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso',
    type: Object
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResult> {
    return this.refreshTokenUseCase.call(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer logout do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso'
  })
  @ApiResponse({ status: 404, description: 'Refresh token não encontrado' })
  async logout(@Body() logoutDto: LogoutDto): Promise<{ message: string }> {
    await this.logoutUseCase.call(logoutDto);
    return { message: 'Logout realizado com sucesso' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário',
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  async getProfile(@Request() req): Promise<JwtPayload> {
    return req.user;
  }
} 