import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GetAllBrandsUseCase } from '.';

describe('GetAllBrandsUseCase', () => {
  const repo = mock<IBrandRepository>();
  let useCase: GetAllBrandsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GetAllBrandsUseCase,
        { provide: DOMAIN_TOKENS.BRAND_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GetAllBrandsUseCase);
  });

  it('returns all brands', async () => {
    const brands = [{ id: 'b1' } as Brand];
    repo.find.mockResolvedValue(brands);
    expect(await useCase.call()).toBe(brands);
  });
});
