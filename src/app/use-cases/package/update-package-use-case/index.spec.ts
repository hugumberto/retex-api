import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

  const pkgOwnedBy = (ownerId: string) =>
    ({ id: 'package-id', user: { id: ownerId } } as unknown as Package);

  describe('privileged (ADMIN/OPS)', () => {
    it('updates status and weight on any package', async () => {
      const updated = mock<Package>();
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('someone-else'),
      );
      packageRepositoryMock.update.mockResolvedValue([updated]);

      const response = await updatePackageUseCase.call({
        id: 'package-id',
        data: { status: PackageStatus.IN_TRANSIT, weight: 12.5 },
        requesterId: 'ops-id',
        isPrivileged: true,
      });

      expect(packageRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'package-id' },
        { status: PackageStatus.IN_TRANSIT, weight: 12.5 },
      );
      expect(response).toEqual(updated);
    });

    it('ignores zero weight', async () => {
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('x'),
      );
      packageRepositoryMock.update.mockResolvedValue([mock<Package>()]);

      await updatePackageUseCase.call({
        id: 'package-id',
        data: { status: PackageStatus.COLLECTED, weight: 0 },
        requesterId: 'ops-id',
        isPrivileged: true,
      });

      expect(packageRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'package-id' },
        { status: PackageStatus.COLLECTED },
      );
    });
  });

  describe('non-privileged (USER)', () => {
    it('lets the owner cancel and ignores weight', async () => {
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('me-id'),
      );
      packageRepositoryMock.update.mockResolvedValue([mock<Package>()]);

      await updatePackageUseCase.call({
        id: 'package-id',
        data: { status: PackageStatus.CANCELLED, weight: 99 },
        requesterId: 'me-id',
        isPrivileged: false,
      });

      expect(packageRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'package-id' },
        { status: PackageStatus.CANCELLED },
      );
    });

    it('hides another user\'s package (404)', async () => {
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('someone-else'),
      );

      await expect(
        updatePackageUseCase.call({
          id: 'package-id',
          data: { status: PackageStatus.CANCELLED },
          requesterId: 'me-id',
          isPrivileged: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids the owner from non-cancel transitions', async () => {
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('me-id'),
      );

      await expect(
        updatePackageUseCase.call({
          id: 'package-id',
          data: { status: PackageStatus.STOCKED },
          requesterId: 'me-id',
          isPrivileged: false,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  it('throws not found when the package does not exist', async () => {
    packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(undefined);

    await expect(
      updatePackageUseCase.call({
        id: 'missing-id',
        data: { status: PackageStatus.IN_TRANSIT },
        requesterId: 'ops-id',
        isPrivileged: true,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
