import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import {
  CollectionRequest,
  CollectionRequestStatus,
} from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { SetCollectionRequestRouteUseCase } from '.';

describe('SetCollectionRequestRouteUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const routeRepo = mock<IRouteRepository>();
  const bagRepo = mock<ICollectionRequestBagRepository>();
  let useCase: SetCollectionRequestRouteUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SetCollectionRequestRouteUseCase,
        {
          provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY,
          useValue: collectionRequestRepo,
        },
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
        {
          provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY,
          useValue: bagRepo,
        },
      ],
    }).compile();
    useCase = module.get(SetCollectionRequestRouteUseCase);
  });

  const requestOn = (routeId?: string) =>
    ({
      id: 'cr-1',
      status: CollectionRequestStatus.COLLECTED,
      route: routeId ? ({ id: routeId } as Route) : undefined,
    } as CollectionRequest);

  it('throws when the collection request does not exist', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(undefined);

    await expect(
      useCase.call({ collectionRequestId: 'cr-1', routeId: 'route-1' }),
    ).rejects.toThrow(NotFoundException);
    expect(collectionRequestRepo.update).not.toHaveBeenCalled();
  });

  it('throws when the route does not exist', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(requestOn());
    routeRepo.findOne.mockResolvedValue(undefined);

    await expect(
      useCase.call({ collectionRequestId: 'cr-1', routeId: 'route-1' }),
    ).rejects.toThrow(NotFoundException);
    expect(collectionRequestRepo.update).not.toHaveBeenCalled();
  });

  it('links to any route without touching the status, and moves the bags along', async () => {
    const route = { id: 'route-2' } as Route;
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(
      requestOn('route-1'),
    );
    routeRepo.findOne.mockResolvedValue(route);

    await useCase.call({ collectionRequestId: 'cr-1', routeId: 'route-2' });

    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'cr-1' },
      { route },
    );
    expect(bagRepo.update).toHaveBeenCalledWith(
      { collectionRequestId: 'cr-1' },
      { routeId: 'route-2' },
    );
  });

  it('removes the request from its route', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(
      requestOn('route-1'),
    );

    await useCase.call({ collectionRequestId: 'cr-1', routeId: null });

    expect(routeRepo.findOne).not.toHaveBeenCalled();
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'cr-1' },
      { route: null },
    );
    expect(bagRepo.update).toHaveBeenCalledWith(
      { collectionRequestId: 'cr-1' },
      { routeId: null },
    );
  });

  it('does nothing when the request is already on that route', async () => {
    collectionRequestRepo.findOneWithAllRelations.mockResolvedValue(
      requestOn('route-1'),
    );
    routeRepo.findOne.mockResolvedValue({ id: 'route-1' } as Route);

    await useCase.call({ collectionRequestId: 'cr-1', routeId: 'route-1' });

    expect(collectionRequestRepo.update).not.toHaveBeenCalled();
    expect(bagRepo.update).not.toHaveBeenCalled();
  });
});
