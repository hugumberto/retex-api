import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteAddressUseCase } from '.';

describe('DeleteAddressUseCase', () => {
  let useCase: DeleteAddressUseCase;
  const addressRepositoryMock = mock<IAddressRepository>();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteAddressUseCase,
        {
          provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY,
          useValue: addressRepositoryMock,
        },
      ],
    }).compile();
    useCase = module.get(DeleteAddressUseCase);
  });

  const param = { userId: 'me-id', addressId: 'addr-id' };

  it('throws NotFound when the address belongs to another user', async () => {
    addressRepositoryMock.findOne.mockResolvedValue({
      id: 'addr-id',
      userId: 'someone-else',
    } as Address);
    await expect(useCase.call(param)).rejects.toThrow(NotFoundException);
  });

  it('deletes a non-default address without reassigning', async () => {
    addressRepositoryMock.findOne.mockResolvedValue({
      id: 'addr-id',
      userId: 'me-id',
      isDefault: false,
    } as Address);

    await useCase.call(param);

    expect(addressRepositoryMock.delete).toHaveBeenCalledWith({ id: 'addr-id' });
    expect(addressRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('reassigns default to the most recent remaining address', async () => {
    addressRepositoryMock.findOne.mockResolvedValue({
      id: 'addr-id',
      userId: 'me-id',
      isDefault: true,
    } as Address);
    addressRepositoryMock.findByUser.mockResolvedValue([
      { id: 'old', createdAt: new Date('2024-01-01') } as Address,
      { id: 'recent', createdAt: new Date('2025-06-01') } as Address,
    ]);

    await useCase.call(param);

    expect(addressRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'recent' },
      { isDefault: true },
    );
  });
});
