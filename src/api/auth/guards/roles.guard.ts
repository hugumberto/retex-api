import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../../../app/services/interfaces/auth.interface';
import { hasAnyRole } from '../../../domain/user/role-hierarchy';
import { Role } from '../../../domain/user/user-roles.entity';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('errors.auth.notAuthenticated');
    }

    // Via `hasAnyRole` e não `includes` directo: o MASTER satisfaz tudo o que o
    // ADMIN satisfaz sem estar listado em cada `@Roles(...)`.
    const hasRole = hasAnyRole(user.roles, requiredRoles);

    if (!hasRole) {
      throw new ForbiddenException('errors.auth.accessDenied');
    }

    return true;
  }
} 