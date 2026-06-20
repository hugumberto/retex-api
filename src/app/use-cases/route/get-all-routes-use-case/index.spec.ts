import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllRoutesUseCase } from '.';

describe('GetAllRoutesUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  let useCase: GetAllRoutesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllRoutesUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
      ],
    }).compile();
    useCase = module.get(GetAllRoutesUseCase);
  });

  it('paginates routes with defaults', async () => {
    const result = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    routeRepo.findByFiltersWithPagination.mockResolvedValue(result);

    await useCase.call({} as any);

    expect(routeRepo.findByFiltersWithPagination).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });
});
