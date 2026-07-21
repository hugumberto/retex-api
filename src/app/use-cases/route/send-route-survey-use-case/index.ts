import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { Route, RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { buildSurveyEmail } from '../../item/survey-email';

export interface SendRouteSurveyResult {
  sent: number;
}

/**
 * Disparo manual do questionário de satisfação a todos os clientes de uma
 * recolha já finalizada (FINISHED). Envia um email por cliente (dedupe por
 * email). Pode ser disparado mais do que uma vez.
 */
@Injectable()
export class SendRouteSurveyUseCase
  implements IUseCase<string, SendRouteSurveyResult>
{
  private readonly logger = new Logger(SendRouteSurveyUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) {}

  async call(routeId: string): Promise<SendRouteSurveyResult> {
    const route = await this.routeRepository.findOneWithAllRelations(routeId);

    if (!route) {
      throw new NotFoundException('Recolha não encontrada');
    }

    if (route.status !== RouteStatus.FINISHED) {
      throw new BadRequestException(
        'O questionário só pode ser enviado para uma recolha finalizada',
      );
    }

    return this.sendForRoute(route);
  }

  // Envia o questionário aos clientes cujos pacotes foram efetivamente
  // recolhidos (COLLECTED), com dedupe por email. Reutilizado pelo disparo
  // automático quando a rota fica FINISHED. Recebe a rota já carregada com
  // `packages[].user`.
  async sendForRoute(route: Route): Promise<SendRouteSurveyResult> {
    const usersByEmail = new Map<string, (typeof route.packages)[number]['user']>();
    for (const pkg of route.packages ?? []) {
      // Só clientes com recolha concluída — cancelados não recebem questionário.
      if (pkg.status !== PackageStatus.COLLECTED) {
        continue;
      }
      const user = pkg.user;
      if (user?.email) {
        usersByEmail.set(user.email, user);
      }
    }

    let sent = 0;
    for (const user of usersByEmail.values()) {
      try {
        await this.emailService.send(buildSurveyEmail(user));
        sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Falha ao enviar questionário para ${user.email}: ${message}`,
        );
      }
    }

    return { sent };
  }
}
