import { Inject, Injectable } from '@nestjs/common';
import { Category } from '../../../../domain/item/item-category';
import { IItemRepository, TriageQueueEntry } from '../../../../domain/item/item.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

export type TriageQueue = {
  // Do operador com sessão, desde a meia-noite em Portugal.
  today: { pieces: number; requests: number };
  // As 7 categorias dos botões rápidos (1–7), da mais usada para a menos.
  quickCategories: Category[];
  queue: TriageQueueEntry[];
};

const QUICK_CATEGORIES = 7;
const QUEUE_LIMIT = 30;

// Enquanto não houver peças com categoria suficientes, completa com estas.
const DEFAULT_CATEGORIES: Category[] = [
  Category.TROUSERS,
  Category.DRESS,
  Category.SKIRT,
  Category.COAT,
  Category.SWEATER,
  Category.TOP,
  Category.SHORTS,
];

/** Meia-noite de hoje em Portugal (o servidor corre em UTC). */
export const startOfTodayInLisbon = (now = new Date()): Date => {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(now);
  // Diferença entre Lisboa e UTC nesse instante (0 ou 1 h).
  const lisbon = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offsetMs = lisbon.getTime() - utc.getTime();
  return new Date(new Date(`${day}T00:00:00Z`).getTime() - offsetMs);
};

/** Fila do posto de triagem, as contagens de hoje e os atalhos de categoria. */
@Injectable()
export class GetTriageQueueUseCase implements IUseCase<{ operatorId: string }, TriageQueue> {
  constructor(
    @Inject(DOMAIN_TOKENS.ITEM_REPOSITORY)
    private readonly itemRepository: IItemRepository,
  ) {}

  async call({ operatorId }: { operatorId: string }): Promise<TriageQueue> {
    const [queue, today, top] = await Promise.all([
      this.itemRepository.triageQueue(QUEUE_LIMIT),
      this.itemRepository.operatorStats(operatorId, startOfTodayInLisbon()),
      this.itemRepository.topCategories(QUICK_CATEGORIES),
    ]);
    const valid = top.filter((c): c is Category => (Object.values(Category) as string[]).includes(c));
    const quickCategories = [...valid, ...DEFAULT_CATEGORIES.filter((c) => !valid.includes(c))].slice(
      0,
      QUICK_CATEGORIES,
    );
    return { today, quickCategories, queue };
  }
}
