import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { SendCollectionConfirmationUseCase } from '../../package/send-collection-confirmation-use-case';
import { CreateRouteUseCase } from '.';

describe('CreateRouteUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  const userRepo = mock<IUserRepository>();
  const packageRepo = mock<IPackageRepository>();
  const sendConfirmation = mock<SendCollectionConfirmationUseCase>();
  let useCase: CreateRouteUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateRouteUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepo },
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
        { provide: SendCollectionConfirmationUseCase, useValue: sendConfirmation },
      ],
    }).compile();
    useCase = module.get(CreateRouteUseCase);
    sendConfirmation.call.mockResolvedValue(undefined);
  });

  const param = { driverId: 'd1', packageIds: ['p1'], startDate: '2025-01-01' } as any;

  it('throws when the driver does not exist', async () => {
    userRepo.findOneWithRelations.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(NotFoundException);
  });

  it('throws when the user lacks the DRIVER role', async () => {
    userRepo.findOneWithRelations.mockResolvedValue({
      id: 'd1', roles: [{ role: Role.USER }],
    } as User);
    await expect(useCase.call(param)).rejects.toThrow(BadRequestException);
  });

  it('rejects a package already assigned to a route', async () => {
    userRepo.findOneWithRelations.mockResolvedValue({
      id: 'd1', roles: [{ role: Role.DRIVER }],
    } as User);
    packageRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'p1', status: 'CREATED', route: { id: 'other' },
    } as any);

    await expect(useCase.call(param)).rejects.toThrow(ConflictException);
  });

  it('keeps packages CREATED and sends collection confirmation', async () => {
    userRepo.findOneWithRelations.mockResolvedValue({
      id: 'd1', roles: [{ role: Role.DRIVER }],
    } as User);
    packageRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'p1', status: 'CREATED',
    } as any);
    routeRepo.create.mockResolvedValue({ id: 'r1' } as any);

    await useCase.call(param);

    expect(sendConfirmation.call).toHaveBeenCalledWith('p1');
    // não move para WAITING no create (isso passa a ser feito pelo cron).
    expect(packageRepo.update).not.toHaveBeenCalled();
  });
});
