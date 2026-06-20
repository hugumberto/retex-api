import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { CreateBrandUseCase } from '.';

describe('CreateBrandUseCase', () => {
  const repo = mock<IBrandRepository>();
  let useCase: CreateBrandUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateBrandUseCase,
        { provide: DOMAIN_TOKENS.BRAND_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(CreateBrandUseCase);
  });

  it('creates a brand', async () => {
    const brand = { id: 'b1', name: 'Nike' } as Brand;
    repo.create.mockResolvedValue(brand);
    expect(await useCase.call({ name: 'Nike' } as any)).toBe(brand);
    expect(repo.create).toHaveBeenCalled();
  });
});
