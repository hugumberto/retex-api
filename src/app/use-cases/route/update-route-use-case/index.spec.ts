import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { SendCollectionConfirmationUseCase } from '../../collection-request/send-collection-confirmation-use-case';
import { GenerateCollectionBagsUseCase } from '../../collection-request-bag/generate-collection-bags-use-case';
import { SendRouteSurveyUseCase } from '../send-route-survey-use-case';
import { UpdateRouteUseCase } from '.';

describe('UpdateRouteUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  const userRepo = mock<IUserRepository>();
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const collectionRequestBagRepo = mock<ICollectionRequestBagRepository>();
  const systemParamRepo = mock<ISystemParameterRepository>();
  const sendConfirmation = mock<SendCollectionConfirmationUseCase>();
  const generateBags = mock<GenerateCollectionBagsUseCase>();
  const sendRouteSurvey = mock<SendRouteSurveyUseCase>();
  let useCase: UpdateRouteUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateRouteUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepo },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepo },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY, useValue: collectionRequestBagRepo },
        {
          provide: DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY,
          useValue: systemParamRepo,
        },
        { provide: SendCollectionConfirmationUseCase, useValue: sendConfirmation },
        { provide: GenerateCollectionBagsUseCase, useValue: generateBags },
        { provide: SendRouteSurveyUseCase, useValue: sendRouteSurvey },
      ],
    }).compile();
    useCase = module.get(UpdateRouteUseCase);
    sendConfirmation.call.mockResolvedValue(undefined);
    generateBags.call.mockResolvedValue([]);
    sendRouteSurvey.sendForRoute.mockResolvedValue({ sent: 0 });
    systemParamRepo.getSingleton.mockResolvedValue({
      qrCodeThresholdPercentage: 10,
    } as SystemParameter);
  });

  it('throws when the route does not exist', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue(undefined);
    await expect(
      useCase.call({ id: 'r1', data: {} } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('blocks composition changes when the route is not DRAFTING', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1', status: 'CREATED', collectionRequests: [],
    } as unknown as Route);

    await expect(
      useCase.call({ id: 'r1', data: { collectionRequestIds: ['p1'] } } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('sends confirmation to all collectionRequests when moving DRAFTING -> CREATED', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'DRAFTING',
      collectionRequests: [{ id: 'p1' }, { id: 'p2' }],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);

    await useCase.call({ id: 'r1', data: { status: 'CREATED' } } as any);

    expect(sendConfirmation.call).toHaveBeenCalledWith('p1');
    expect(sendConfirmation.call).toHaveBeenCalledWith('p2');
  });

  it('on IN_TRANSIT: moves confirmed collectionRequests to WAITING_FOR_COLLECTION, records count and generates QR', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'WAITING_TO_START',
      collectionRequests: [
        { id: 'p1', collectionConfirmedAt: new Date(), estimatedBags: 3 },
        { id: 'p2', collectionConfirmedAt: null, estimatedBags: 5 },
      ],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);

    await useCase.call({ id: 'r1', data: { status: 'IN_TRANSIT' } } as any);

    // p1 confirmado (3 * 1.1 = 3.3 -> ceil 4).
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: 'WAITING_FOR_COLLECTION', bagsGenerated: 4 },
    );
    expect(generateBags.call).toHaveBeenCalledWith({
      routeId: 'r1',
      quantity: 4,
    });
    // p2 não confirmado — não é tocado.
    expect(collectionRequestRepo.update).not.toHaveBeenCalledWith(
      { id: 'p2' },
      expect.anything(),
    );
  });

  it('on IN_TRANSIT: generates at least 1 QR when volumes are missing/zero', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'WAITING_TO_START',
      collectionRequests: [
        { id: 'p1', collectionConfirmedAt: new Date(), estimatedBags: null },
      ],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);

    await useCase.call({ id: 'r1', data: { status: 'IN_TRANSIT' } } as any);

    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: 'WAITING_FOR_COLLECTION', bagsGenerated: 1 },
    );
    expect(generateBags.call).toHaveBeenCalledWith({
      routeId: 'r1',
      quantity: 1,
    });
  });

  it('on FINISHED: deletes unused QR codes of the route', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1', status: 'IN_TRANSIT', collectionRequests: [],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);
    collectionRequestBagRepo.deleteUnusedByRoute.mockResolvedValue(2);

    await useCase.call({ id: 'r1', data: { status: 'FINISHED' } } as any);

    expect(collectionRequestBagRepo.deleteUnusedByRoute).toHaveBeenCalledWith('r1');
  });
});
