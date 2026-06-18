import { CreatePackageUseCase } from './create-package-use-case';
import { GetCreatedPackagesUseCase } from './get-created-packages-use-case';
import { GetPackageByIdUseCase } from './get-package-by-id-use-case';
import { UpdatePackageUseCase } from './update-package-use-case';

export const PACKAGE_USE_CASES = [
  CreatePackageUseCase,
  GetCreatedPackagesUseCase,
  GetPackageByIdUseCase,
  UpdatePackageUseCase,
];
