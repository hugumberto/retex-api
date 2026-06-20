import { CreatePackageUseCase } from './create-package-use-case';
import { GetAllPackagesUseCase } from './get-all-packages-use-case';
import { GetCreatedPackagesUseCase } from './get-created-packages-use-case';
import { GetPackageByIdUseCase } from './get-package-by-id-use-case';
import { GetUserPackagesUseCase } from './get-user-packages-use-case';
import { UpdatePackageUseCase } from './update-package-use-case';

export const PACKAGE_USE_CASES = [
  CreatePackageUseCase,
  GetCreatedPackagesUseCase,
  GetPackageByIdUseCase,
  UpdatePackageUseCase,
  GetUserPackagesUseCase,
  GetAllPackagesUseCase,
];

export { GetUserPackagesUseCase } from './get-user-packages-use-case';
export { GetAllPackagesUseCase } from './get-all-packages-use-case';
