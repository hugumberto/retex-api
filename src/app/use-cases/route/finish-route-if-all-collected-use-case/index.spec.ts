import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { ICollectionRequestBagRepository } from '../../../../domain/collection-request-bag/collection-request-bag.repository';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { SendRouteSurveyUseCase } from '../send-route-survey-use-case';
import { FinishRouteIfAllCollectedUseCase } from '.';

describe('FinishRouteIfAllCollectedUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  const collectionRequestBagRepo = mock<ICollectionRequestBagRepository>();
  const sendRouteSurvey = mock<SendRouteSurveyUseCase>();
  let useCase: FinishRouteIfAllCollectedUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FinishRouteIfAllCollectedUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_BAG_REPOSITORY, useValue: collectionRequestBagRepo },
        { provide: SendRouteSurveyUseCase, useValue: sendRouteSurvey },
      ],
    }).compile();
    useCase = module.get(FinishRouteIfAllCollectedUseCase);
    sendRouteSurvey.sendForRoute.mockResolvedValue({ sent: 0 });
  });

  it('finishes the route and deletes unused QR when all collectionRequests are COLLECTED/CANCELLED', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'IN_TRANSIT',
      collectionRequests: [{ status: 'COLLECTED' }, { status: 'CANCELLED' }],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);

    await useCase.call('r1');

    expect(routeRepo.update).toHaveBeenCalledWith(
      { id: 'r1' },
      { status: 'FINISHED' },
    );
    expect(collectionRequestBagRepo.deleteUnusedByRoute).toHaveBeenCalledWith('r1');
    expect(sendRouteSurvey.sendForRoute).toHaveBeenCalled();
  });

  it('does nothing when a package is not yet collected/cancelled', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'IN_TRANSIT',
      collectionRequests: [{ status: 'COLLECTED' }, { status: 'SCREENING' }],
    } as unknown as Route);

    await useCase.call('r1');

    expect(routeRepo.update).not.toHaveBeenCalled();
    expect(collectionRequestBagRepo.deleteUnusedByRoute).not.toHaveBeenCalled();
  });

  it('does nothing when the route is already FINISHED', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'FINISHED',
      collectionRequests: [{ status: 'COLLECTED' }],
    } as unknown as Route);

    await useCase.call('r1');

    expect(routeRepo.update).not.toHaveBeenCalled();
  });
});
