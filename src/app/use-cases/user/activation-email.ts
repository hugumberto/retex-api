import { SendEmailOptions } from '../../services/interfaces/email.interface';
import { User } from '../../../domain/user/user.entity';

/** Dados mínimos do destinatário para montar um email transacional. */
type EmailRecipient = Pick<
  User,
  'id' | 'firstName' | 'lastName' | 'email' | 'language'
>;

/**
 * Constrói o email de ativação de conta (utilizador dentro da zona de atuação).
 * Centraliza template/context para ser reutilizado no registo e quando o
 * utilizador se torna elegível após a criação de uma zona. O assunto e o corpo
 * saem no idioma do destinatário (`email.account-activation.*`).
 */
export function buildActivationEmail(
  user: EmailRecipient,
  token: string,
): SendEmailOptions {
  const activationUrl = `${process.env.PORTAL_URL}/auth/activate?token=${token}`;

  return {
    to: user.email,
    template: 'account-activation',
    locale: user.language,
    context: {
      firstName: user.firstName,
      lastName: user.lastName,
      activationUrl,
      year: new Date().getFullYear(),
    },
    meta: { type: 'account-activation', userId: user.id },
  };
}

/**
 * Constrói o email de reposição de palavra-passe (link com token, válido 1h).
 */
export function buildPasswordResetEmail(
  user: EmailRecipient,
  token: string,
): SendEmailOptions {
  const resetUrl = `${process.env.PORTAL_URL}/auth/reset-password?token=${token}`;

  return {
    to: user.email,
    template: 'password-reset',
    locale: user.language,
    context: {
      firstName: user.firstName,
      lastName: user.lastName,
      resetUrl,
      year: new Date().getFullYear(),
    },
    meta: { type: 'password-reset', userId: user.id },
  };
}
