import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Package } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetPackageByIdUseCase } from '.';

describe('GetPackageByIdUseCase', () => {
  let getPackageByIdUseCase: GetPackageByIdUseCase;
  const packageRepositoryMock = mock<IPackageRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        GetPackageByIdUseCase,
        {
          provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY,
          useValue: packageRepositoryMock,
        },
      ],
    }).compile();

    getPackageByIdUseCase = module.get(GetPackageByIdUseCase);
  });

  describe('call', () => {
    it('should return a package with relations', async () => {
      const pkg = mock<Package>();
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(pkg);

      const response = await getPackageByIdUseCase.call('package-id');

      expect(response).toEqual(pkg);
      expect(
        packageRepositoryMock.findOneWithAllRelations,
      ).toHaveBeenCalledWith('package-id');
    });

    it('should throw not found when package does not exist', async () => {
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        undefined,
      );

      await expect(getPackageByIdUseCase.call('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
