import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATE_LOCALE, normalizeLanguage } from '../../../../config/i18n.constants';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { ICompanyMemberRepository } from '../../../../domain/company/company.repository';
import { findCompanyManagerEmails } from '../../shared/company-managers.util';
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
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(SERVICE_TOKENS.EMAIL_SERVICE)
    private readonly emailService: IEmailService,
    @Inject(DOMAIN_TOKENS.COMPANY_MEMBER_REPOSITORY)
    private readonly companyMemberRepository: ICompanyMemberRepository,
  ) { }

  async call(collectionRequestId: string): Promise<void> {
    const pkg = await this.collectionRequestRepository.findOneWithAllRelations(collectionRequestId);
    if (!pkg?.user?.email || !pkg.route?.startDate) {
      return;
    }

    const token = generateCollectionConfirmationToken();
    await this.collectionRequestRepository.update(
      { id: pkg.id },
      { collectionConfirmationToken: token, collectionConfirmedAt: null },
    );

    const confirmUrl = `${process.env.PORTAL_URL}/confirmar-coleta?token=${token}`;
    const rejectUrl = `${process.env.PORTAL_URL}/confirmar-coleta?token=${token}&action=reject`;
    // A data sai no formato do idioma do destinatário (13/05/2026, 13/05/2026,
    // 5/13/2026, ...), coerente com o resto do email.
    const language = normalizeLanguage(pkg.user.language);
    const collectionDate = new Date(pkg.route.startDate).toLocaleDateString(
      DATE_LOCALE[language],
    );

    // Numa solicitação de empresa, confirma quem pediu (está no local) e o
    // gestor fica a par.
    const cc = await findCompanyManagerEmails(
      this.companyMemberRepository,
      pkg.companyId,
      pkg.user.email,
    );

    await this.emailService.send({
      to: pkg.user.email,
      cc,
      template: 'collection-confirmation',
      locale: language,
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
