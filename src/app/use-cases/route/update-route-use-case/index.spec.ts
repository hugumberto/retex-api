import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { SendCollectionConfirmationUseCase } from '../../package/send-collection-confirmation-use-case';
import { UpdateRouteUseCase } from '.';

describe('UpdateRouteUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  const userRepo = mock<IUserRepository>();
  const packageRepo = mock<IPackageRepository>();
  const sendConfirmation = mock<SendCollectionConfirmationUseCase>();
  let useCase: UpdateRouteUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateRouteUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepo },
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: packageRepo },
        { provide: SendCollectionConfirmationUseCase, useValue: sendConfirmation },
      ],
    }).compile();
    useCase = module.get(UpdateRouteUseCase);
    sendConfirmation.call.mockResolvedValue(undefined);
  });

  it('throws when the route does not exist', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue(undefined);
    await expect(
      useCase.call({ id: 'r1', data: {} } as any),
    ).rejects.toThrow(NotFoundException);
  });
});
