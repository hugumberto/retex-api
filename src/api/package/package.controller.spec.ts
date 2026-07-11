import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ConfirmCollectionUseCase } from '../../app/use-cases/package/confirm-collection-use-case';
import { CreatePackageUseCase } from '../../app/use-cases/package/create-package-use-case';
import { GetAllPackagesUseCase } from '../../app/use-cases/package/get-all-packages-use-case';
import { GetCreatedPackagesUseCase } from '../../app/use-cases/package/get-created-packages-use-case';
import { GetPackageByIdUseCase } from '../../app/use-cases/package/get-package-by-id-use-case';
import { RejectCollectionUseCase } from '../../app/use-cases/package/reject-collection-use-case';
import { UpdatePackageUseCase } from '../../app/use-cases/package/update-package-use-case';
import { PackageStatus } from '../../domain/package/package.entity';
import { Role } from '../../domain/user/user-roles.entity';
import { PackageController } from './package.controller';

const reqWith = (roles: Role[], sub = 'requester-id') =>
  ({ user: { sub, email: 'req@example.com', roles } } as unknown as Request);

describe('PackageController', () => {
  let controller: PackageController;
  let createPackageUseCase: CreatePackageUseCase;
  let getPackageByIdUseCase: GetPackageByIdUseCase;
  let updatePackageUseCase: UpdatePackageUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackageController],
      providers: [
        { provide: CreatePackageUseCase, useValue: { call: jest.fn() } },
        { provide: GetCreatedPackagesUseCase, useValue: { call: jest.fn() } },
        { provide: GetPackageByIdUseCase, useValue: { call: jest.fn() } },
        { provide: UpdatePackageUseCase, useValue: { call: jest.fn() } },
        { provide: GetAllPackagesUseCase, useValue: { call: jest.fn() } },
        { provide: ConfirmCollectionUseCase, useValue: { call: jest.fn() } },
        { provide: RejectCollectionUseCase, useValue: { call: jest.fn() } },
      ],
    }).compile();

    controller = module.get(PackageController);
    createPackageUseCase = module.get(CreatePackageUseCase);
    getPackageByIdUseCase = module.get(GetPackageByIdUseCase);
    updatePackageUseCase = module.get(UpdatePackageUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPackage', () => {
    const body = {
      userId: 'victim-id',
      addressId: 'address-id',
      estimatedVolumes: 2,
    } as any;

    it('forces a USER to create the package for themselves (ignores body.userId)', async () => {
      await controller.createPackage(reqWith([Role.USER], 'me-id'), body);
      expect(createPackageUseCase.call).toHaveBeenCalledWith({
        ...body,
        userId: 'me-id',
      });
    });

    it('lets ADMIN/OPS create for the userId in the body', async () => {
      await controller.createPackage(reqWith([Role.ADMIN], 'admin-id'), body);
      expect(createPackageUseCase.call).toHaveBeenCalledWith({
        ...body,
        userId: 'victim-id',
      });
    });
  });

  describe('getPackageById', () => {
    it('passes requester + privilege flag to the use-case', async () => {
      await controller.getPackageById(reqWith([Role.OPS], 'ops-id'), 'pkg-id');
      expect(getPackageByIdUseCase.call).toHaveBeenCalledWith({
        id: 'pkg-id',
        requesterId: 'ops-id',
        isPrivileged: true,
      });
    });

    it('marks a plain USER as not privileged', async () => {
      await controller.getPackageById(reqWith([Role.USER], 'user-id'), 'pkg-id');
      expect(getPackageByIdUseCase.call).toHaveBeenCalledWith({
        id: 'pkg-id',
        requesterId: 'user-id',
        isPrivileged: false,
      });
    });
  });

  describe('updatePackage', () => {
    it('passes requester + privilege flag to the use-case', async () => {
      const data = { status: PackageStatus.CANCELLED } as any;
      await controller.updatePackage(
        reqWith([Role.USER], 'user-id'),
        'pkg-id',
        data,
      );
      expect(updatePackageUseCase.call).toHaveBeenCalledWith({
        id: 'pkg-id',
        data,
        requesterId: 'user-id',
        isPrivileged: false,
      });
    });
  });
});
