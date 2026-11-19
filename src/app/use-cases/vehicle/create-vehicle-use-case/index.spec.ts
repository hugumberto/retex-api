import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IVehicleRepository } from '../../../../domain/vehicle/vehicle.repository';
import { CreateVehicleUseCase } from '.';

describe('CreateVehicleUseCase', () => {
  const vehicleRepo = mock<IVehicleRepository>();
  let useCase: CreateVehicleUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateVehicleUseCase,
        { provide: DOMAIN_TOKENS.VEHICLE_REPOSITORY, useValue: vehicleRepo },
      ],
    }).compile();
    useCase = module.get(CreateVehicleUseCase);
    vehicleRepo.create.mockImplementation(async (data) => ({ id: 'v1', ...data }) as any);
  });

  it('normaliza a matrícula e fica ativo por omissão', async () => {
    vehicleRepo.findByPlate.mockResolvedValue(null);

    await useCase.call({ plate: ' aa-00-bb ', name: ' Carrinha ', capacityBags: 30 });

    expect(vehicleRepo.create).toHaveBeenCalledWith({
      plate: 'AA-00-BB',
      name: 'Carrinha',
      capacityBags: 30,
      active: true,
    });
  });

  it('recusa matrícula repetida', async () => {
    vehicleRepo.findByPlate.mockResolvedValue({ id: 'v0' } as any);
    await expect(
      useCase.call({ plate: 'AA-00-BB', name: 'Carrinha', capacityBags: 30 }),
    ).rejects.toThrow(ConflictException);
  });
});
