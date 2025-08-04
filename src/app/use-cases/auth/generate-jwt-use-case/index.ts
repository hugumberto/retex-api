import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../../../domain/user/user.entity';
import { JwtPayload, JwtResult } from '../../../services/interfaces/auth.interface';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GenerateJwtUseCase implements IUseCase<User, JwtResult> {
  constructor(private readonly jwtService: JwtService) { }

  async call(user: User): Promise<JwtResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map(role => role.role),
    };

    const access_token = this.jwtService.sign(payload);

    // Removemos a senha do retorno
    const { password, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }
} 