import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { SetDefaultAddressUseCase } from '.';

describe('SetDefaultAddressUseCase', () => {
  let useCase: SetDefaultAddressUseCase;
  const addressRepositoryMock = mock<IAddressRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SetDefaultAddressUseCase,
        {
          provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY,
          useValue: addressRepositoryMock,
        },
      ],
    }).compile();
    useCase = module.get(SetDefaultAddressUseCase);
  });

  const param = { userId: 'me-id', addressId: 'addr-id' };

  it('throws NotFound when the address does not exist', async () => {
    addressRepositoryMock.findOne.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFound when the address belongs to another user', async () => {
    addressRepositoryMock.findOne.mockResolvedValue({
      id: 'addr-id',
      userId: 'someone-else',
    } as Address);
    await expect(useCase.call(param)).rejects.toThrow(NotFoundException);
  });

  it('unsets previous default and sets the new one', async () => {
    const updated = { id: 'addr-id', isDefault: true } as Address;
    addressRepositoryMock.findOne.mockResolvedValue({
      id: 'addr-id',
      userId: 'me-id',
    } as Address);
    addressRepositoryMock.update.mockResolvedValue([updated]);

    const result = await useCase.call(param);

    expect(addressRepositoryMock.unsetDefault).toHaveBeenCalledWith('me-id');
    expect(addressRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'addr-id' },
      { isDefault: true },
    );
    expect(result).toEqual(updated);
  });
});
