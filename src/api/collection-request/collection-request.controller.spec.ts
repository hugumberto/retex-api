import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ConfirmCollectionUseCase } from '../../app/use-cases/collection-request/confirm-collection-use-case';
import { CreateCollectionRequestUseCase } from '../../app/use-cases/collection-request/create-collection-request-use-case';
import { GetAllCollectionRequestsUseCase } from '../../app/use-cases/collection-request/get-all-collection-requests-use-case';
import { GetCreatedCollectionRequestsUseCase } from '../../app/use-cases/collection-request/get-created-collection-requests-use-case';
import { GetCollectionRequestByIdUseCase } from '../../app/use-cases/collection-request/get-collection-request-by-id-use-case';
import { RejectCollectionUseCase } from '../../app/use-cases/collection-request/reject-collection-use-case';
import { UpdateCollectionRequestUseCase } from '../../app/use-cases/collection-request/update-collection-request-use-case';
import { CollectionRequestStatus } from '../../domain/collection-request/collection-request.entity';
import { Role } from '../../domain/user/user-roles.entity';
import { CollectionRequestController } from './collection-request.controller';

const reqWith = (roles: Role[], sub = 'requester-id') =>
  ({ user: { sub, email: 'req@example.com', roles } } as unknown as Request);

describe('CollectionRequestController', () => {
  let controller: CollectionRequestController;
  let createCollectionRequestUseCase: CreateCollectionRequestUseCase;
  let getCollectionRequestByIdUseCase: GetCollectionRequestByIdUseCase;
  let updateCollectionRequestUseCase: UpdateCollectionRequestUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionRequestController],
      providers: [
        { provide: CreateCollectionRequestUseCase, useValue: { call: jest.fn() } },
        { provide: GetCreatedCollectionRequestsUseCase, useValue: { call: jest.fn() } },
        { provide: GetCollectionRequestByIdUseCase, useValue: { call: jest.fn() } },
        { provide: UpdateCollectionRequestUseCase, useValue: { call: jest.fn() } },
        { provide: GetAllCollectionRequestsUseCase, useValue: { call: jest.fn() } },
        { provide: ConfirmCollectionUseCase, useValue: { call: jest.fn() } },
        { provide: RejectCollectionUseCase, useValue: { call: jest.fn() } },
      ],
    }).compile();

    controller = module.get(CollectionRequestController);
    createCollectionRequestUseCase = module.get(CreateCollectionRequestUseCase);
    getCollectionRequestByIdUseCase = module.get(GetCollectionRequestByIdUseCase);
    updateCollectionRequestUseCase = module.get(UpdateCollectionRequestUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCollectionRequest', () => {
    const body = {
      userId: 'victim-id',
      addressId: 'address-id',
      estimatedVolumes: 2,
    } as any;

    it('forces a USER to create the package for themselves (ignores body.userId)', async () => {
      await controller.createCollectionRequest(reqWith([Role.USER], 'me-id'), body);
      expect(createCollectionRequestUseCase.call).toHaveBeenCalledWith({
        ...body,
        userId: 'me-id',
      });
    });

    it('lets ADMIN/OPS create for the userId in the body', async () => {
      await controller.createCollectionRequest(reqWith([Role.ADMIN], 'admin-id'), body);
      expect(createCollectionRequestUseCase.call).toHaveBeenCalledWith({
        ...body,
        userId: 'victim-id',
      });
    });
  });

  describe('getCollectionRequestById', () => {
    it('passes requester + privilege flag to the use-case', async () => {
      await controller.getCollectionRequestById(reqWith([Role.OPS], 'ops-id'), 'pkg-id');
      expect(getCollectionRequestByIdUseCase.call).toHaveBeenCalledWith({
        id: 'pkg-id',
        requesterId: 'ops-id',
        isPrivileged: true,
      });
    });

    it('marks a plain USER as not privileged', async () => {
      await controller.getCollectionRequestById(reqWith([Role.USER], 'user-id'), 'pkg-id');
      expect(getCollectionRequestByIdUseCase.call).toHaveBeenCalledWith({
        id: 'pkg-id',
        requesterId: 'user-id',
        isPrivileged: false,
      });
    });
  });

  describe('updateCollectionRequest', () => {
    it('passes requester + privilege flag to the use-case', async () => {
      const data = { status: CollectionRequestStatus.CANCELLED } as any;
      await controller.updateCollectionRequest(
        reqWith([Role.USER], 'user-id'),
        'pkg-id',
        data,
      );
      expect(updateCollectionRequestUseCase.call).toHaveBeenCalledWith({
        id: 'pkg-id',
        data,
        requesterId: 'user-id',
        isPrivileged: false,
      });
    });
  });
});
