import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IEmailLogRepository } from '../../../../domain/email-log/email-log.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetEmailLogsUseCase } from '.';

describe('GetEmailLogsUseCase', () => {
  const emailLogRepo = mock<IEmailLogRepository>();
  let useCase: GetEmailLogsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetEmailLogsUseCase,
        { provide: DOMAIN_TOKENS.EMAIL_LOG_REPOSITORY, useValue: emailLogRepo },
      ],
    }).compile();
    useCase = module.get(GetEmailLogsUseCase);
    emailLogRepo.findByFiltersWithPagination.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
  });

  it('normalizes date-only filters to inclusive day boundaries (UTC)', async () => {
    await useCase.call({ from: '2026-07-01', to: '2026-07-31' });

    const [filters] = emailLogRepo.findByFiltersWithPagination.mock.calls[0];
    expect(filters.from?.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(filters.to?.toISOString()).toBe('2026-07-31T23:59:59.999Z');
  });

  it('passes full datetime filters through unchanged', async () => {
    await useCase.call({ from: '2026-07-01T08:30:00.000Z' });

    const [filters] = emailLogRepo.findByFiltersWithPagination.mock.calls[0];
    expect(filters.from?.toISOString()).toBe('2026-07-01T08:30:00.000Z');
    expect(filters.to).toBeUndefined();
  });

  it('defaults pagination to page 1 / limit 20', async () => {
    await useCase.call({});

    const [, pagination] = emailLogRepo.findByFiltersWithPagination.mock.calls[0];
    expect(pagination).toEqual({ page: 1, limit: 20 });
  });

  it('forwards type/userId/recipient filters', async () => {
    await useCase.call({ type: 'survey', userId: 'u1', recipient: 'a@x.pt' });

    const [filters] = emailLogRepo.findByFiltersWithPagination.mock.calls[0];
    expect(filters).toMatchObject({
      type: 'survey',
      userId: 'u1',
      recipient: 'a@x.pt',
    });
  });
});
