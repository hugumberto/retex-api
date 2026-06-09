import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import {
  Package,
  PackageStatus,
} from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { UpdatePackageUseCase } from '.';

describe('UpdatePackageUseCase', () => {
  let updatePackageUseCase: UpdatePackageUseCase;
  const packageRepositoryMock = mock<IPackageRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        UpdatePackageUseCase,
        {
          provide: DOMAIN_TOKENS.PACKAGE_REPOSITORY,
          useValue: packageRepositoryMock,
        },
      ],
    }).compile();

    updatePackageUseCase = module.get(UpdatePackageUseCase);
  });

  describe('call', () => {
    it('should update status and weight when weight is greater than zero', async () => {
      const existingPackage = mock<Package>();
      const updatedPackage = mock<Package>();

      packageRepositoryMock.findOne.mockResolvedValue(existingPackage);
      packageRepositoryMock.update.mockResolvedValue([updatedPackage]);

      const response = await updatePackageUseCase.call({
        id: 'package-id',
        data: {
          status: PackageStatus.IN_TRANSIT,
          weight: 12.5,
        },
      });

      expect(packageRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'package-id' },
        {
          status: PackageStatus.IN_TRANSIT,
          weight: 12.5,
        },
      );
      expect(response).toEqual(updatedPackage);
    });

    it('should ignore weight when it is zero and update only status', async () => {
      const existingPackage = mock<Package>();
      const updatedPackage = mock<Package>();

      packageRepositoryMock.findOne.mockResolvedValue(existingPackage);
      packageRepositoryMock.update.mockResolvedValue([updatedPackage]);

      await updatePackageUseCase.call({
        id: 'package-id',
        data: {
          status: PackageStatus.COLLECTED,
          weight: 0,
        },
      });

      expect(packageRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'package-id' },
        { status: PackageStatus.COLLECTED },
      );
    });

    it('should return package without updating when only zero weight is provided', async () => {
      const existingPackage = mock<Package>();

      packageRepositoryMock.findOne.mockResolvedValue(existingPackage);

      const response = await updatePackageUseCase.call({
        id: 'package-id',
        data: {
          weight: 0,
        },
      });

      expect(packageRepositoryMock.update).not.toHaveBeenCalled();
      expect(response).toEqual(existingPackage);
    });

    it('should throw not found when package does not exist', async () => {
      packageRepositoryMock.findOne.mockResolvedValue(undefined);

      await expect(
        updatePackageUseCase.call({
          id: 'missing-id',
          data: { status: PackageStatus.IN_TRANSIT },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
