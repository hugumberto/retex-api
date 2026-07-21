import { Inject, Injectable, Logger } from '@nestjs/common';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { generateCollectionConfirmationToken } from '../collection-token.util';

/**
 * Gera o token de confirmação de coleta, persiste no package e envia o email
 * ao cliente com o link para confirmar o dia da recolha (route.startDate).
 * Chamado (fire-and-forget) quando uma solicitação é atribuída a uma rota.
 */
@Injectable()
export class SendCollectionConfirmationUseCase implements IUseCase<string, void> {
  private readonly logger = new Logger(SendCollectionConfirmationUseCase.name);

  constructor(
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
  ) { }

  async call(packageId: string): Promise<void> {
    const pkg = await this.packageRepository.findOneWithAllRelations(packageId);
    if (!pkg?.user?.email || !pkg.route?.startDate) {
      return;
    }

    const token = generateCollectionConfirmationToken();
    await this.packageRepository.update(
      { id: pkg.id },
      { collectionConfirmationToken: token, collectionConfirmedAt: null },
    );

    const confirmUrl = `${process.env.PORTAL_URL}/confirmar-coleta?token=${token}`;
    const rejectUrl = `${process.env.PORTAL_URL}/confirmar-coleta?token=${token}&action=reject`;
    const collectionDate = new Date(pkg.route.startDate).toLocaleDateString(
      'pt-PT',
    );

    await this.emailService.send({
      to: pkg.user.email,
      subject: 'Confirme o dia da sua recolha Retex',
      template: 'collection-confirmation',
      context: {
        firstName: pkg.user.firstName,
        lastName: pkg.user.lastName,
        friendlyCode: pkg.friendlyCode,
        collectionDate,
        collectionInterval: pkg.route.collectionInterval,
        confirmUrl,
        rejectUrl,
        year: new Date().getFullYear(),
      },
      meta: { type: 'collection-confirmation', userId: pkg.user.id },
    });

    this.logger.log(`Email de confirmação de coleta enviado para ${pkg.user.email}`);
  }
}
