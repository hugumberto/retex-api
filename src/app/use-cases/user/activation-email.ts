import { SendEmailOptions } from '../../services/interfaces/email.interface';
import { User } from '../../../domain/user/user.entity';

/**
 * Constrói o email de ativação de conta (utilizador dentro da zona de atuação).
 * Centraliza subject/template/context para ser reutilizado no registo e quando
 * o utilizador se torna elegível após a criação de uma zona.
 */
export function buildActivationEmail(
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>,
  token: string,
): SendEmailOptions {
  const activationUrl = `${process.env.PORTAL_URL}/auth/activate?token=${token}`;

  return {
    to: user.email,
    subject: 'Ative a sua conta Retex',
    template: 'account-activation',
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
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>,
  token: string,
): SendEmailOptions {
  const resetUrl = `${process.env.PORTAL_URL}/auth/reset-password?token=${token}`;

  return {
    to: user.email,
    subject: 'Repor a palavra-passe Retex',
    template: 'password-reset',
    context: {
      firstName: user.firstName,
      lastName: user.lastName,
      resetUrl,
      year: new Date().getFullYear(),
    },
    meta: { type: 'password-reset', userId: user.id },
  };
}
