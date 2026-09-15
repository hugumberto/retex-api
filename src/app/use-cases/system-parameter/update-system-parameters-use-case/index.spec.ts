import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UpdateSystemParametersUseCase } from '.';
import { UpdateSystemParametersDto } from './update-system-parameters.dto';

const EXISTING = { id: 'sp-1' } as SystemParameter;

// O rolo em uso: 50x30mm com o QR a ocupar a altura útil.
const validDto = (): UpdateSystemParametersDto => ({
  collectionConfirmationDeadlineDays: 2,
  qrCodeThresholdPercentage: 10,
  labelWidthMm: 50,
  labelHeightMm: 30,
  labelQrSizeMm: 24,
  labelRotationDeg: 0,
});

describe('UpdateSystemParametersUseCase', () => {
  const repository = mock<ISystemParameterRepository>();
  let useCase: UpdateSystemParametersUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateSystemParametersUseCase,
        {
          provide: DOMAIN_TOKENS.SYSTEM_PARAMETER_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();
    useCase = module.get(UpdateSystemParametersUseCase);

    repository.getSingleton.mockResolvedValue(EXISTING);
    repository.update.mockResolvedValue([EXISTING]);
  });

  it('grava as medidas da etiqueta na linha existente', async () => {
    await useCase.call(validDto());

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'sp-1' },
      expect.objectContaining({
        labelWidthMm: 50,
        labelHeightMm: 30,
        labelQrSizeMm: 24,
      }),
    );
  });

  it('cria a linha com as medidas quando ainda não existe', async () => {
    repository.getSingleton.mockResolvedValue(null);
    repository.create.mockResolvedValue(EXISTING);

    await useCase.call(validDto());

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ labelWidthMm: 50, labelQrSizeMm: 24 }),
    );
  });

  // A regra não cabe no DTO: os três valores só fazem sentido uns face aos
  // outros, e gravar um QR a mais dava uma folha inteira de etiquetas cortadas.
  it('grava a rotação escolhida', async () => {
    await useCase.call({ ...validDto(), labelRotationDeg: 90 });

    expect(repository.update).toHaveBeenCalledWith(
      { id: 'sp-1' },
      expect.objectContaining({ labelRotationDeg: 90 }),
    );
  });

  it('recusa um QR mais alto do que a altura útil da etiqueta', async () => {
    // 30mm de altura menos 2mm de margem de cada lado deixam 26mm.
    await expect(
      useCase.call({ ...validDto(), labelQrSizeMm: 27 }),
    ).rejects.toThrow(
      new BadRequestException('errors.systemParameter.qrLargerThanLabel'),
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('recusa um QR que não deixe espaço para o código ao lado', async () => {
    // 40mm de largura menos 4mm de margem e 10mm de código deixam 26mm.
    await expect(
      useCase.call({
        ...validDto(),
        labelWidthMm: 40,
        labelHeightMm: 60,
        labelQrSizeMm: 30,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('aceita o QR exatamente no limite', async () => {
    await expect(
      useCase.call({ ...validDto(), labelQrSizeMm: 26 }),
    ).resolves.toBe(EXISTING);
  });
});
