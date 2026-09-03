import { DATE_ONLY_PATTERN } from '../../../../domain/dashboard/date-range';
import { IsOptional, Matches } from 'class-validator';

/** Filtro do quadro de atividade: um dia, um intervalo, ou nada (tudo). */
export class GetDashboardActivityDto {
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'from deve ser uma data YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'to deve ser uma data YYYY-MM-DD' })
  to?: string;
}

export interface DashboardActivityStats {
  /** Ecoam o filtro aplicado, para o cliente confirmar o que está a ver. */
  from: string | null;
  to: string | null;
  /** Solicitações criadas no intervalo. */
  requests: number;
  /** Solicitações efetivamente recolhidas (sacos vinculados) no intervalo. */
  collections: number;
  /** Solicitações com triagem feita (sacos processados) no intervalo. */
  triages: number;
  /** Peças lançadas na triagem — soma das quantidades, não das linhas. */
  pieces: number;
}
