import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { GenerateQrCodesUseCase } from '.';

describe('GenerateQrCodesUseCase', () => {
  const repo = mock<IQrCodeRepository>();
  let useCase: GenerateQrCodesUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        GenerateQrCodesUseCase,
        { provide: DOMAIN_TOKENS.QR_CODE_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(GenerateQrCodesUseCase);
    repo.findOne.mockResolvedValue(undefined);
    repo.deleteExpiredUnused.mockResolvedValue(0);
    repo.create.mockImplementation(async (dto) => dto as QrCode);
  });

  it('purges expired unused codes before generating', async () => {
    await useCase.call({ quantity: 1 });
    expect(repo.deleteExpiredUnused).toHaveBeenCalledTimes(1);
  });

  it('creates N codes sharing one batchId, each with token + friendlyCode', async () => {
    const result = await useCase.call({ quantity: 3 });

    expect(repo.create).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(3);
    const batchIds = new Set(result.map((qr) => qr.batchId));
    expect(batchIds.size).toBe(1);
    result.forEach((qr) => {
      expect(qr.token).toMatch(/^[0-9a-f]{32}$/);
      expect(qr.friendlyCode).toMatch(/^\d{4}-[A-Z0-9]{6}$/);
    });
  });
});
