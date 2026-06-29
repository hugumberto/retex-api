import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllPackagesUseCase } from '.';

describe('GetAllPackagesUseCase', () => {
  const repo = mock<IPackageRepository>();
  let useCase: GetAllPackagesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllPackagesUseCase,
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetAllPackagesUseCase);
  });

  it('returns all packages', async () => {
    const pkgs = [{ id: 'p1' } as Package];
    repo.findAll.mockResolvedValue(pkgs);
    expect(await useCase.call()).toBe(pkgs);
  });
});
