import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IVehicleRepository } from '../../../../domain/vehicle/vehicle.repository';
import { UpdateVehicleUseCase } from '.';

describe('UpdateVehicleUseCase', () => {
  const vehicleRepo = mock<IVehicleRepository>();
  let useCase: UpdateVehicleUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UpdateVehicleUseCase,
        { provide: DOMAIN_TOKENS.VEHICLE_REPOSITORY, useValue: vehicleRepo },
      ],
    }).compile();
    useCase = module.get(UpdateVehicleUseCase);
    vehicleRepo.update.mockImplementation(async (_q, data) => [{ id: 'v1', ...data }] as any);
  });

  it('dá 404 quando o veículo não existe', async () => {
    vehicleRepo.findOne.mockResolvedValue(undefined);
    await expect(useCase.call({ id: 'v1', data: { active: false } })).rejects.toThrow(NotFoundException);
  });

  it('desativa sem mexer no resto', async () => {
    vehicleRepo.findOne.mockResolvedValue({ id: 'v1' } as any);
    await useCase.call({ id: 'v1', data: { active: false } });
    expect(vehicleRepo.update).toHaveBeenCalledWith({ id: 'v1' }, { active: false });
  });

  it('recusa mudar para a matrícula de outro veículo', async () => {
    vehicleRepo.findOne.mockResolvedValue({ id: 'v1' } as any);
    vehicleRepo.findByPlate.mockResolvedValue({ id: 'v2' } as any);
    await expect(useCase.call({ id: 'v1', data: { plate: 'bb-11-cc' } })).rejects.toThrow(ConflictException);
  });
});
