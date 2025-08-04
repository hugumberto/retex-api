import { User } from '../../../domain/user/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface JwtResult {
  access_token: string;
  user: Omit<User, 'password'>;
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  user: Omit<User, 'password'>;
}

export interface RefreshTokenResult {
  access_token: string;
  refresh_token: string;
} 