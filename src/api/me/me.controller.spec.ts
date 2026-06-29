import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { CreateAddressUseCase } from '../../app/use-cases/address/create-address-use-case';
import { DeleteAddressUseCase } from '../../app/use-cases/address/delete-address-use-case';
import { GetUserAddressesUseCase } from '../../app/use-cases/address/get-user-addresses-use-case';
import { SetDefaultAddressUseCase } from '../../app/use-cases/address/set-default-address-use-case';
import { GetUserPackagesUseCase } from '../../app/use-cases/package';
import { UpdateMePasswordUseCase, UpdateUserUseCase } from '../../app/use-cases/user';
import { MeController } from './me.controller';

const reqAs = (sub: string) => ({ user: { sub } } as unknown as Request);

describe('MeController (uses JWT sub, never a client-supplied id)', () => {
  let controller: MeController;
  const mocks = {
    create: { call: jest.fn() },
    list: { call: jest.fn() },
    setDefault: { call: jest.fn() },
    del: { call: jest.fn() },
    packages: { call: jest.fn() },
    updateUser: { call: jest.fn() },
    updatePwd: { call: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [MeController],
      providers: [
        { provide: CreateAddressUseCase, useValue: mocks.create },
        { provide: GetUserAddressesUseCase, useValue: mocks.list },
        { provide: SetDefaultAddressUseCase, useValue: mocks.setDefault },
        { provide: DeleteAddressUseCase, useValue: mocks.del },
        { provide: GetUserPackagesUseCase, useValue: mocks.packages },
        { provide: UpdateUserUseCase, useValue: mocks.updateUser },
        { provide: UpdateMePasswordUseCase, useValue: mocks.updatePwd },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();
    controller = module.get(MeController);
  });

  it('getMyPackages scopes to the authenticated user', () => {
    controller.getMyPackages(reqAs('me-id'));
    expect(mocks.packages.call).toHaveBeenCalledWith({ userId: 'me-id' });
  });

  it('getAddresses scopes to the authenticated user', () => {
    controller.getAddresses(reqAs('me-id'));
    expect(mocks.list.call).toHaveBeenCalledWith('me-id');
  });

  it('createAddress forces the authenticated userId', () => {
    controller.createAddress(reqAs('me-id'), { street: 'R' } as any);
    expect(mocks.create.call).toHaveBeenCalledWith({ street: 'R', userId: 'me-id' });
  });

  it('setDefault scopes to the authenticated user', () => {
    controller.setDefault(reqAs('me-id'), 'addr-1');
    expect(mocks.setDefault.call).toHaveBeenCalledWith({
      userId: 'me-id',
      addressId: 'addr-1',
    });
  });

  it('deleteAddress scopes to the authenticated user', () => {
    controller.deleteAddress(reqAs('me-id'), 'addr-1');
    expect(mocks.del.call).toHaveBeenCalledWith({
      userId: 'me-id',
      addressId: 'addr-1',
    });
  });

  it('updateMe targets the authenticated user id', () => {
    controller.updateMe(reqAs('me-id'), { contactPhone: '999' });
    expect(mocks.updateUser.call).toHaveBeenCalledWith({
      id: 'me-id',
      data: { contactPhone: '999' },
    });
  });
});
