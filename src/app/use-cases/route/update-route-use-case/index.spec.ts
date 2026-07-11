import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { SendCollectionConfirmationUseCase } from '../../package/send-collection-confirmation-use-case';
import { GenerateCollectionQrCodesUseCase } from '../../qr-code/generate-collection-qr-codes-use-case';
import { UpdateRouteUseCase } from '.';

describe('UpdateRouteUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  const userRepo = mock<IUserRepository>();
  const packageRepo = mock<IPackageRepository>();
  const qrCodeRepo = mock<IQrCodeRepository>();
  const systemParamRepo = mock<ISystemParameterRepository>();
  const sendConfirmation = mock<SendCollectionConfirmationUseCase>();
  const generateQrCodes = mock<GenerateCollectionQrCodesUseCase>();
  let useCase: UpdateRouteUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateRouteUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepo },
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: qrCodeRepo },
        {
          provide: DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY,
          useValue: systemParamRepo,
        },
        { provide: SendCollectionConfirmationUseCase, useValue: sendConfirmation },
        { provide: GenerateCollectionQrCodesUseCase, useValue: generateQrCodes },
      ],
    }).compile();
    useCase = module.get(UpdateRouteUseCase);
    sendConfirmation.call.mockResolvedValue(undefined);
    generateQrCodes.call.mockResolvedValue([]);
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
      id: 'r1', status: 'CREATED', packages: [],
    } as unknown as Route);

    await expect(
      useCase.call({ id: 'r1', data: { packageIds: ['p1'] } } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('sends confirmation to all packages when moving DRAFTING -> CREATED', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'DRAFTING',
      packages: [{ id: 'p1' }, { id: 'p2' }],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);

    await useCase.call({ id: 'r1', data: { status: 'CREATED' } } as any);

    expect(sendConfirmation.call).toHaveBeenCalledWith('p1');
    expect(sendConfirmation.call).toHaveBeenCalledWith('p2');
  });

  it('on IN_TRANSIT: moves confirmed packages to WAITING_FOR_COLLECTION, records count and generates QR', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'WAITING_TO_START',
      packages: [
        { id: 'p1', collectionConfirmedAt: new Date(), estimatedVolumes: 3 },
        { id: 'p2', collectionConfirmedAt: null, estimatedVolumes: 5 },
      ],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);

    await useCase.call({ id: 'r1', data: { status: 'IN_TRANSIT' } } as any);

    // p1 confirmado (3 * 1.1 = 3.3 -> ceil 4).
    expect(packageRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: 'WAITING_FOR_COLLECTION', qrCodesGenerated: 4 },
    );
    expect(generateQrCodes.call).toHaveBeenCalledWith({
      routeId: 'r1',
      quantity: 4,
    });
    // p2 não confirmado — não é tocado.
    expect(packageRepo.update).not.toHaveBeenCalledWith(
      { id: 'p2' },
      expect.anything(),
    );
  });

  it('on IN_TRANSIT: generates at least 1 QR when volumes are missing/zero', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'WAITING_TO_START',
      packages: [
        { id: 'p1', collectionConfirmedAt: new Date(), estimatedVolumes: null },
      ],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);

    await useCase.call({ id: 'r1', data: { status: 'IN_TRANSIT' } } as any);

    expect(packageRepo.update).toHaveBeenCalledWith(
      { id: 'p1' },
      { status: 'WAITING_FOR_COLLECTION', qrCodesGenerated: 1 },
    );
    expect(generateQrCodes.call).toHaveBeenCalledWith({
      routeId: 'r1',
      quantity: 1,
    });
  });

  it('on FINISHED: deletes unused QR codes of the route', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1', status: 'IN_TRANSIT', packages: [],
    } as unknown as Route);
    routeRepo.update.mockResolvedValue([{ id: 'r1' } as Route]);
    qrCodeRepo.deleteUnusedByRoute.mockResolvedValue(2);

    await useCase.call({ id: 'r1', data: { status: 'FINISHED' } } as any);

    expect(qrCodeRepo.deleteUnusedByRoute).toHaveBeenCalledWith('r1');
  });
});
