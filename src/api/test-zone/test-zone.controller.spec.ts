import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import {
  CreateTestZoneUseCase,
  DeleteTestZoneUseCase,
  GetAllTestZonesUseCase,
  NotifyZoneInactiveUsersUseCase,
} from '../../app/use-cases/test-zone';
import { TestZoneController } from './test-zone.controller';

describe('TestZoneController', () => {
  let controller: TestZoneController;
  const create = { call: jest.fn() };
  const getAll = { call: jest.fn() };
  const del = { call: jest.fn() };
  const notify = { call: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [TestZoneController],
      providers: [
        { provide: CreateTestZoneUseCase, useValue: create },
        { provide: GetAllTestZonesUseCase, useValue: getAll },
        { provide: DeleteTestZoneUseCase, useValue: del },
        { provide: NotifyZoneInactiveUsersUseCase, useValue: notify },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();
    controller = module.get(TestZoneController);
  });

  it('creates a zone', async () => {
    await controller.create({ city: 'Lisboa' } as any);
    expect(create.call).toHaveBeenCalledWith({ city: 'Lisboa' });
  });

  it('notifies inactive users of a zone by id', async () => {
    await controller.notify('zone-id');
    expect(notify.call).toHaveBeenCalledWith({ zoneId: 'zone-id' });
  });

  it('deletes a zone by id', async () => {
    await controller.remove('zone-id');
    expect(del.call).toHaveBeenCalledWith({ id: 'zone-id' });
  });
});
