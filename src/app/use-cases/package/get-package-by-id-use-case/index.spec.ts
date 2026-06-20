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

  const pkgOwnedBy = (ownerId: string) =>
    ({ id: 'pkg-id', user: { id: ownerId } } as unknown as Package);

  describe('call', () => {
    it('returns the package for a privileged requester (ADMIN/OPS)', async () => {
      const pkg = pkgOwnedBy('someone-else');
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(pkg);

      const response = await getPackageByIdUseCase.call({
        id: 'pkg-id',
        requesterId: 'admin-id',
        isPrivileged: true,
      });

      expect(response).toEqual(pkg);
    });

    it('returns the package when the USER owns it', async () => {
      const pkg = pkgOwnedBy('me-id');
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(pkg);

      const response = await getPackageByIdUseCase.call({
        id: 'pkg-id',
        requesterId: 'me-id',
        isPrivileged: false,
      });

      expect(response).toEqual(pkg);
    });

    it('hides another user\'s package from a non-privileged requester (404)', async () => {
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(
        pkgOwnedBy('someone-else'),
      );

      await expect(
        getPackageByIdUseCase.call({
          id: 'pkg-id',
          requesterId: 'me-id',
          isPrivileged: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws not found when the package does not exist', async () => {
      packageRepositoryMock.findOneWithAllRelations.mockResolvedValue(undefined);

      await expect(
        getPackageByIdUseCase.call({
          id: 'missing-id',
          requesterId: 'admin-id',
          isPrivileged: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
