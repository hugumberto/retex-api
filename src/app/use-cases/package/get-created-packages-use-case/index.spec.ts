import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetCreatedPackagesUseCase } from '.';

describe('GetCreatedPackagesUseCase', () => {
  const repo = mock<IPackageRepository>();
  let useCase: GetCreatedPackagesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetCreatedPackagesUseCase,
        { provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetCreatedPackagesUseCase);
  });

  it('lists only CREATED and unrouted packages with default pagination', async () => {
    const result = { data: [], meta: { total: 0, page: 1, limit: 1000, totalPages: 0 } };
    repo.findByFiltersWithPagination.mockResolvedValue(result);

    await useCase.call({} as any);

    expect(repo.findByFiltersWithPagination).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'CREATED', unrouted: true }),
      expect.objectContaining({ page: 1, limit: 1000 }),
    );
  });
});
