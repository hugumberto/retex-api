import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetUserPackagesUseCase } from '.';

describe('GetUserPackagesUseCase', () => {
  const repo = mock<IPackageRepository>();
  let useCase: GetUserPackagesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetUserPackagesUseCase,
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetUserPackagesUseCase);
  });

  it('lists packages for the given user', async () => {
    const pkgs = [{ id: 'p1' } as Package];
    repo.findByUser.mockResolvedValue(pkgs);
    expect(await useCase.call({ userId: 'u1' })).toBe(pkgs);
    expect(repo.findByUser).toHaveBeenCalledWith('u1');
  });
});
