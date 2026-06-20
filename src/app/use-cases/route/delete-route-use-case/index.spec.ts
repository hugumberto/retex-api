import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteRouteUseCase } from '.';

describe('DeleteRouteUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  const packageRepo = mock<IPackageRepository>();
  let useCase: DeleteRouteUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteRouteUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
      ],
    }).compile();
    useCase = module.get(DeleteRouteUseCase);
  });

  it('throws when the route does not exist', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue(undefined);
    await expect(useCase.call('r1')).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing route', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({ id: 'r1', packages: [] } as unknown as Route);
    routeRepo.delete.mockResolvedValue({ id: 'r1' } as Route);
    await useCase.call('r1');
    expect(routeRepo.delete).toHaveBeenCalledWith({ id: 'r1' });
  });
});
