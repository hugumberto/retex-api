/**
 * Intervalo de dias, ambos os extremos inclusive e opcionais: sem `from` conta
 * desde sempre, sem `to` conta até hoje.
 *
 * As datas viajam como texto `YYYY-MM-DD`, e não como `Date`, porque o que o
 * utilizador escolhe no filtro é um dia — não um instante. Converter para
 * `Date` no caminho traria o fuso horário do servidor para uma decisão que é
 * de calendário.
 */
export interface DateRange {
  from?: string;
  to?: string;
}

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
