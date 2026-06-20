import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TestZone } from '../../../../domain/test-zone/test-zone.entity';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { buildActivationEmail } from '../../user/activation-email';
import { generateActivationToken } from '../../user/activation-token.util';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class NotifyZoneInactiveUsersUseCase
  implements IUseCase<{ zoneId: string }, { notified: number }> {
  private readonly logger = new Logger(NotifyZoneInactiveUsersUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
  ) {}

  async call({ zoneId }: { zoneId: string }): Promise<{ notified: number }> {
    const zone = await this.testZoneRepository.findOne({ id: zoneId } as Partial<TestZone>);
    if (!zone) {
      throw new NotFoundException('Zona não encontrada');
    }

    const city = this.sanitizationService.sanitizeString(zone.city);
    const users = await this.userRepository.findInactiveUsersByCity(city);

    let notified = 0;
    for (const user of users) {
      try {
        await this.sendActivation(user);
        notified += 1;
      } catch (err) {
        this.logger.error(
          `Falha ao notificar ${user.email}: ${err.message}`,
        );
      }
    }

    return { notified };
  }

  private async sendActivation(user: User): Promise<void> {
    const { token, expiresAt } = generateActivationToken();
    await this.userRepository.update(
      { id: user.id } as Partial<User>,
      {
        activationToken: token,
        activationTokenExpiresAt: expiresAt,
      } as Partial<User>,
    );
    await this.emailService.send(buildActivationEmail(user, token));
  }
}
