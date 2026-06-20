import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetUserAddressesUseCase } from '.';

describe('GetUserAddressesUseCase', () => {
  const repo = mock<IAddressRepository>();
  let useCase: GetUserAddressesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetUserAddressesUseCase,
        { provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetUserAddressesUseCase);
  });

  it('lists addresses for the given user', async () => {
    const addresses = [{ id: 'a1' } as Address];
    repo.findByUser.mockResolvedValue(addresses);
    expect(await useCase.call('u1')).toBe(addresses);
    expect(repo.findByUser).toHaveBeenCalledWith('u1');
  });
});
