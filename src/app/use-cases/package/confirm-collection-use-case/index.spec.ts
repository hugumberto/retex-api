import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { Route, RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ConfirmCollectionUseCase } from '.';

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

describe('ConfirmCollectionUseCase', () => {
  const packageRepo = mock<IPackageRepository>();
  const systemParamRepo = mock<ISystemParameterRepository>();
  const routeRepo = mock<IRouteRepository>();
  let useCase: ConfirmCollectionUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ConfirmCollectionUseCase,
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
        { provide: DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY, useValue: systemParamRepo },
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
      ],
    }).compile();
    useCase = module.get(ConfirmCollectionUseCase);
    systemParamRepo.getSingleton.mockResolvedValue({
      collectionConfirmationDeadlineDays: 2,
    } as SystemParameter);
  });

  it('throws NotFound when the token does not match', async () => {
    packageRepo.findByCollectionConfirmationToken.mockResolvedValue(undefined);
    await expect(useCase.call({ token: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('throws when the deadline has already passed', async () => {
    packageRepo.findByCollectionConfirmationToken.mockResolvedValue({
      id: 'p1',
      route: { startDate: daysFromNow(-1) },
    } as Package);
    await expect(useCase.call({ token: 'x' })).rejects.toThrow(BadRequestException);
  });

  it('confirms within the window: sets confirmedAt and clears the token', async () => {
    packageRepo.findByCollectionConfirmationToken.mockResolvedValue({
      id: 'p1',
      route: { startDate: daysFromNow(30) },
    } as Package);
    packageRepo.update.mockResolvedValue([{ id: 'p1' } as Package]);

    await useCase.call({ token: 'x' });

    expect(packageRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      expect.objectContaining({
        collectionConfirmedAt: expect.any(Date),
        collectionConfirmationToken: null,
      }),
    );
  });

  it('advances the route to WAITING_TO_START when all packages are confirmed', async () => {
    packageRepo.findByCollectionConfirmationToken.mockResolvedValue({
      id: 'p1',
      route: { id: 'r1', startDate: daysFromNow(30) },
    } as Package);
    packageRepo.update.mockResolvedValue([{ id: 'p1' } as Package]);
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: RouteStatus.CREATED,
      packages: [
        { id: 'p1', collectionConfirmedAt: new Date() },
        { id: 'p2', collectionConfirmedAt: new Date() },
      ],
    } as Route);

    await useCase.call({ token: 'x' });

    expect(routeRepo.update).toHaveBeenCalledWith(
      { id: 'r1' },
      { status: RouteStatus.WAITING_TO_START },
    );
  });

  it('does not advance the route while a package is still unconfirmed', async () => {
    packageRepo.findByCollectionConfirmationToken.mockResolvedValue({
      id: 'p1',
      route: { id: 'r1', startDate: daysFromNow(30) },
    } as Package);
    packageRepo.update.mockResolvedValue([{ id: 'p1' } as Package]);
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: RouteStatus.CREATED,
      packages: [
        { id: 'p1', collectionConfirmedAt: new Date() },
        { id: 'p2', collectionConfirmedAt: null },
      ],
    } as Route);

    await useCase.call({ token: 'x' });

    expect(routeRepo.update).not.toHaveBeenCalled();
  });
});
