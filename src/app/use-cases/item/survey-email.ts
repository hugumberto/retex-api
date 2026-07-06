import { SendEmailOptions } from '../../services/interfaces/email.interface';
import { User } from '../../../domain/user/user.entity';

// Link do questionário (Google Forms). Configurável por env; default do ticket RT-33.
const DEFAULT_SURVEY_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeR8CaOofRyLMVzBjBmC-yZ6dXvsDBuayXdZsLvrfgnZ5zQ6Q/viewform?usp=sharing&ouid=101688441139837488699';

/**
 * Email de questionário de satisfação, enviado ao cliente quando a triagem da
 * sua solicitação de recolha é finalizada.
 */
export function buildSurveyEmail(
  user: Pick<User, 'firstName' | 'lastName' | 'email'>,
): SendEmailOptions {
  const surveyUrl = process.env.SURVEY_FORM_URL ?? DEFAULT_SURVEY_URL;

  return {
    to: user.email,
    subject: 'A tua opinião é importante',
    template: 'survey',
    context: {
      firstName: user.firstName,
      lastName: user.lastName,
      surveyUrl,
      year: new Date().getFullYear(),
    },
  };
}
