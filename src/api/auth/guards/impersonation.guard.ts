import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../../app/services/interfaces/auth.interface';
import { isUuid } from '../../../app/use-cases/shared/identifier.util';
import { isMaster, isPrivileged } from '../../../domain/user/role-hierarchy';
import { DOMAIN_TOKENS } from '../../../domain/tokens';
import { Role } from '../../../domain/user/user-roles.entity';
import { IUserRepository } from '../../../domain/user/user.repository';

export const IMPERSONATION_HEADER = 'x-impersonate-user';

/** Registo do modo "ver como" no pedido, para quem quiser auditar mais abaixo. */
export interface ImpersonationContext {
  byUserId: string;
  byEmail: string;
  asUserId: string;
}

/**
 * Modo "ver como": um MASTER vê o portal pelos olhos de um cliente.
 *
 * A sessão continua a ser a do master — o que o header faz é trocar a identidade
 * efetiva **deste pedido**, para os endpoints resolverem o âmbito a partir do
 * cliente sem terem de saber que isto existe. Não se emite nenhum token para o
 * alvo: assim não há credencial nova a poder sobreviver ao modo, e sair é
 * apenas deixar de enviar o header.
 *
 * Três limites, todos aqui:
 *  - só um MASTER pode usá-lo;
 *  - só leitura (GET), porque escrever em nome de outra pessoa não é ver;
 *  - o alvo tem de ser um cliente (Role.USER e nunca ADMIN/MASTER), o que
 *    também impede o degrau de um master se pôr dentro de outro.
 *
 * Corre depois do `JwtAuthGuard` (precisa do `request.user`) e antes do
 * `RolesGuard`, que passa então a validar as roles do alvo.
 */
@Injectable()
export class ImpersonationGuard implements CanActivate {
  private readonly logger = new Logger(ImpersonationGuard.name);

  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers[IMPERSONATION_HEADER];
    const targetId = Array.isArray(header) ? header[0] : header;

    if (!targetId) {
      return true;
    }

    const actor = request['user'] as JwtPayload | undefined;
    if (!actor) {
      throw new ForbiddenException('errors.auth.notAuthenticated');
    }

    if (!isMaster(actor.roles)) {
      throw new ForbiddenException('errors.auth.impersonationForbidden');
    }

    if (request.method !== 'GET') {
      throw new ForbiddenException('errors.auth.impersonationReadOnly');
    }

    // Sem isto, um identificador com outro formato chegaria ao Postgres e
    // rebentava como 500 em vez de 404.
    if (!isUuid(targetId)) {
      throw new NotFoundException('errors.user.notFound');
    }

    const target = await this.userRepository.findOneWithRelations({
      id: targetId,
    });
    if (!target) {
      throw new NotFoundException('errors.user.notFound');
    }

    const targetRoles = target.roles?.map((userRole) => userRole.role) ?? [];
    if (isPrivileged(targetRoles) || !targetRoles.includes(Role.USER)) {
      throw new ForbiddenException('errors.auth.impersonationTargetNotAllowed');
    }

    request['user'] = {
      sub: target.id,
      email: target.email,
      roles: targetRoles,
    } as JwtPayload;

    const impersonation: ImpersonationContext = {
      byUserId: actor.sub,
      byEmail: actor.email,
      asUserId: target.id,
    };
    request['impersonation'] = impersonation;

    // Rasto de auditoria: quem viu o quê em nome de quem.
    this.logger.log(
      `${actor.email} a ver como ${target.email}: ${request.method} ${request.originalUrl}`,
    );

    return true;
  }
}
