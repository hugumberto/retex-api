import { Test, TestingModule } from '@nestjs/testing';
import { CreatePackageUseCase } from '../../app/use-cases/package/create-package-use-case';
import { GetCreatedPackagesUseCase } from '../../app/use-cases/package/get-created-packages-use-case';
import { PackageController } from './package.controller';

describe('PackageController', () => {
  let controller: PackageController;
  let createPackageUseCase: CreatePackageUseCase;
  let getCreatedPackagesUseCase: GetCreatedPackagesUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackageController],
      providers: [
        {
          provide: CreatePackageUseCase,
          useValue: {
            call: jest.fn(),
          },
        },
        {
          provide: GetCreatedPackagesUseCase,
          useValue: {
            call: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PackageController>(PackageController);
    createPackageUseCase = module.get<CreatePackageUseCase>(CreatePackageUseCase);
    getCreatedPackagesUseCase = module.get<GetCreatedPackagesUseCase>(GetCreatedPackagesUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCreatedPackages', () => {
    it('should call GetCreatedPackagesUseCase with correct parameters', async () => {
      const query = {
        collectDay: 'segunda-feira',
        collectTime: 'manhã',
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      jest.spyOn(getCreatedPackagesUseCase, 'call').mockResolvedValue(expectedResult);

      const result = await controller.getCreatedPackages(query);

      expect(getCreatedPackagesUseCase.call).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });
}); 