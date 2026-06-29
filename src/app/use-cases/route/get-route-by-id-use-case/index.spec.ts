import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetRouteByIdUseCase } from '.';

describe('GetRouteByIdUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  let useCase: GetRouteByIdUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetRouteByIdUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
      ],
    }).compile();
    useCase = module.get(GetRouteByIdUseCase);
  });

  it('throws when the route does not exist', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue(undefined);
    await expect(useCase.call('r1')).rejects.toThrow(NotFoundException);
  });

  it('returns the route', async () => {
    const route = { id: 'r1' } as Route;
    routeRepo.findOneWithAllRelations.mockResolvedValue(route);
    expect(await useCase.call('r1')).toBe(route);
  });
});
