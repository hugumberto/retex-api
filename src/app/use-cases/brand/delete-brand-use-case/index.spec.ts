import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Brand } from '../../../../domain/brand/brand.entity';
import { IBrandRepository } from '../../../../domain/brand/brand.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DeleteBrandUseCase } from '.';

describe('DeleteBrandUseCase', () => {
  const repo = mock<IBrandRepository>();
  let useCase: DeleteBrandUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        DeleteBrandUseCase,
        { provide: DOMAIN_TOKENS.BRAND_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(DeleteBrandUseCase);
  });

  it('throws when the brand does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call('b1')).rejects.toThrow('Marca não encontrada');
  });

  it('deletes an existing brand', async () => {
    repo.findOne.mockResolvedValue({ id: 'b1' } as Brand);
    repo.delete.mockResolvedValue({ id: 'b1' } as Brand);
    await useCase.call('b1');
    expect(repo.delete).toHaveBeenCalledWith({ id: 'b1' });
  });
});
