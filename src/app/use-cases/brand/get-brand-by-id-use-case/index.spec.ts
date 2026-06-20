import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetBrandByIdUseCase } from '.';

describe('GetBrandByIdUseCase', () => {
  const repo = mock<IBrandRepository>();
  let useCase: GetBrandByIdUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetBrandByIdUseCase,
        { provide: DOMAIN_TOKENS.BRAND_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetBrandByIdUseCase);
  });

  it('throws when the brand does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call('b1')).rejects.toThrow('Marca não encontrada');
  });

  it('returns the brand', async () => {
    const brand = { id: 'b1' } as Brand;
    repo.findOne.mockResolvedValue(brand);
    expect(await useCase.call('b1')).toBe(brand);
  });
});
