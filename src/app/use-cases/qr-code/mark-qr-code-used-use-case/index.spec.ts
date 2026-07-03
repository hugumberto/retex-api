import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { MarkQrCodeUsedUseCase } from '.';

describe('MarkQrCodeUsedUseCase', () => {
  const repo = mock<IQrCodeRepository>();
  let useCase: MarkQrCodeUsedUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        MarkQrCodeUsedUseCase,
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(MarkQrCodeUsedUseCase);
  });

  it('throws NotFound when the token does not exist', async () => {
    repo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ token: 'nope' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('sets usedAt when the code is not yet used', async () => {
    repo.findOne.mockResolvedValue({ id: 'q1', usedAt: null } as QrCode);
    repo.update.mockResolvedValue([{ id: 'q1' } as QrCode]);

    await useCase.call({ token: 'abc' });

    expect(repo.update).toHaveBeenCalledWith(
      { id: 'q1' },
      expect.objectContaining({ usedAt: expect.any(Date) }),
    );
  });

  it('is idempotent when the code is already used', async () => {
    const already = { id: 'q1', usedAt: new Date() } as QrCode;
    repo.findOne.mockResolvedValue(already);

    const result = await useCase.call({ token: 'abc' });

    expect(repo.update).not.toHaveBeenCalled();
    expect(result).toBe(already);
  });
});
