import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpdateBrandUseCase } from '.';

describe('UpdateBrandUseCase', () => {
  const repo = mock<IBrandRepository>();
  let useCase: UpdateBrandUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateBrandUseCase,
        { provide: DOMAIN_TOKENS.BRAND_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(UpdateBrandUseCase);
  });

  it('throws when the brand does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(
      useCase.call({ id: 'b1', data: { name: 'X' } } as any),
    ).rejects.toThrow('Marca não encontrada');
  });

  it('updates an existing brand', async () => {
    repo.findOne.mockResolvedValue({ id: 'b1' } as Brand);
    repo.update.mockResolvedValue([{ id: 'b1', name: 'X' } as Brand]);
    await useCase.call({ id: 'b1', data: { name: 'X' } } as any);
    expect(repo.update).toHaveBeenCalledWith({ id: 'b1' }, { name: 'X' });
  });
});
