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

  const UUID = '11111111-1111-1111-1111-111111111111';

  it('throws when the route does not exist', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue(undefined);
    await expect(useCase.call(UUID)).rejects.toThrow(NotFoundException);
  });

  it('returns the route when looked up by id (UUID)', async () => {
    const route = { id: UUID } as Route;
    routeRepo.findOneWithAllRelations.mockResolvedValue(route);
    expect(await useCase.call(UUID)).toBe(route);
    expect(routeRepo.findOne).not.toHaveBeenCalled();
  });

  it('resolves the route by friendly code when the id is not a UUID', async () => {
    const route = { id: UUID, friendlyCode: '2026-ABCDEF' } as Route;
    routeRepo.findOne.mockResolvedValue(route);
    routeRepo.findOneWithAllRelations.mockResolvedValue(route);

    expect(await useCase.call('2026-ABCDEF')).toBe(route);
    expect(routeRepo.findOne).toHaveBeenCalledWith({ friendlyCode: '2026-ABCDEF' });
    expect(routeRepo.findOneWithAllRelations).toHaveBeenCalledWith(UUID);
  });

  it('throws when the friendly code does not match any route', async () => {
    routeRepo.findOne.mockResolvedValue(undefined as unknown as Route);
    await expect(useCase.call('2026-NOPE00')).rejects.toThrow(NotFoundException);
  });
});
