import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { FinishRouteIfAllCollectedUseCase } from '.';

describe('FinishRouteIfAllCollectedUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  const qrCodeRepo = mock<IQrCodeRepository>();
  let useCase: FinishRouteIfAllCollectedUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FinishRouteIfAllCollectedUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: qrCodeRepo },
      ],
    }).compile();
    useCase = module.get(FinishRouteIfAllCollectedUseCase);
  });

  it('finishes the route and deletes unused QR when all packages are COLLECTED/CANCELLED', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'IN_TRANSIT',
      packages: [{ status: 'COLLECTED' }, { status: 'CANCELLED' }],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);

    await useCase.call('r1');

    expect(routeRepo.update).toHaveBeenCalledWith(
      { id: 'r1' },
      { status: 'FINISHED' },
    );
    expect(qrCodeRepo.deleteUnusedByRoute).toHaveBeenCalledWith('r1');
  });

  it('does nothing when a package is not yet collected/cancelled', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'IN_TRANSIT',
      packages: [{ status: 'COLLECTED' }, { status: 'SCREENING' }],
    } as unknown as Route);

    await useCase.call('r1');

    expect(routeRepo.update).not.toHaveBeenCalled();
    expect(qrCodeRepo.deleteUnusedByRoute).not.toHaveBeenCalled();
  });

  it('does nothing when the route is already FINISHED', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'FINISHED',
      packages: [{ status: 'COLLECTED' }],
    } as unknown as Route);

    await useCase.call('r1');

    expect(routeRepo.update).not.toHaveBeenCalled();
  });
});
