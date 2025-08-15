import { Test, TestingModule } from '@nestjs/testing';
import { CreateRouteUseCase } from '../../app/use-cases/route/create-route-use-case';
import { GetAllRoutesUseCase } from '../../app/use-cases/route/get-all-routes-use-case';
import { GetRouteByIdUseCase } from '../../app/use-cases/route/get-route-by-id-use-case';
import { UpdateRouteUseCase } from '../../app/use-cases/route/update-route-use-case';
import { RouteController } from './route.controller';

describe('RouteController', () => {
  let controller: RouteController;
  let createRouteUseCase: CreateRouteUseCase;
  let getAllRoutesUseCase: GetAllRoutesUseCase;
  let getRouteByIdUseCase: GetRouteByIdUseCase;
  let updateRouteUseCase: UpdateRouteUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RouteController],
      providers: [
        {
          provide: CreateRouteUseCase,
          useValue: {
            call: jest.fn(),
          },
        },
        {
          provide: GetAllRoutesUseCase,
          useValue: {
            call: jest.fn(),
          },
        },
        {
          provide: GetRouteByIdUseCase,
          useValue: {
            call: jest.fn(),
          },
        },
        {
          provide: UpdateRouteUseCase,
          useValue: {
            call: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RouteController>(RouteController);
    createRouteUseCase = module.get<CreateRouteUseCase>(CreateRouteUseCase);
    getAllRoutesUseCase = module.get<GetAllRoutesUseCase>(GetAllRoutesUseCase);
    getRouteByIdUseCase = module.get<GetRouteByIdUseCase>(GetRouteByIdUseCase);
    updateRouteUseCase = module.get<UpdateRouteUseCase>(UpdateRouteUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createRoute', () => {
    it('should call CreateRouteUseCase with correct parameters', async () => {
      const createRouteDto = {
        driverId: 'driver-uuid-123',
        packageIds: ['package-1', 'package-2'],
        startDate: '2024-01-15T10:00:00Z',
      };

      const expectedResult = {
        id: 'route-uuid',
        status: 'DRAFTING',
        driverId: 'driver-uuid-123',
        packageIds: ['package-1', 'package-2'],
        startDate: new Date('2024-01-15T10:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(createRouteUseCase, 'call').mockResolvedValue(expectedResult as any);

      const result = await controller.createRoute(createRouteDto);

      expect(createRouteUseCase.call).toHaveBeenCalledWith(createRouteDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAllRoutes', () => {
    it('should call GetAllRoutesUseCase with correct parameters', async () => {
      const query = {
        status: 'DRAFTING' as any,
        driverId: 'driver-uuid-123',
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        data: [
          {
            id: 'route-uuid',
            packagesCount: 3, // Agora retorna apenas o count
          }
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      jest.spyOn(getAllRoutesUseCase, 'call').mockResolvedValue(expectedResult as any);

      const result = await controller.getAllRoutes(query);

      expect(getAllRoutesUseCase.call).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getRouteById', () => {
    it('should call GetRouteByIdUseCase with correct parameters', async () => {
      const id = 'route-uuid-123';

      const expectedResult = {
        id: 'route-uuid-123',
        status: 'DRAFTING',
        driver: { id: 'driver-uuid', firstName: 'João' },
        packages: [
          { id: 'package-1', status: 'CREATED' },
          { id: 'package-2', status: 'CREATED' }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(getRouteByIdUseCase, 'call').mockResolvedValue(expectedResult as any);

      const result = await controller.getRouteById(id);

      expect(getRouteByIdUseCase.call).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateRoute', () => {
    it('should call UpdateRouteUseCase with correct parameters', async () => {
      const id = 'route-uuid-123';
      const updateRouteDto = {
        status: 'CREATED' as any,
        endDate: '2024-01-16T18:00:00Z',
      };

      const expectedResult = {
        id: 'route-uuid-123',
        status: 'CREATED',
        endDate: new Date('2024-01-16T18:00:00Z'),
        updatedAt: new Date(),
      };

      jest.spyOn(updateRouteUseCase, 'call').mockResolvedValue(expectedResult as any);

      const result = await controller.updateRoute(id, updateRouteDto);

      expect(updateRouteUseCase.call).toHaveBeenCalledWith({ id, data: updateRouteDto });
      expect(result).toEqual(expectedResult);
    });
  });
}); 