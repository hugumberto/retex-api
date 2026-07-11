import { ConfirmCollectionUseCase } from './confirm-collection-use-case';
import { CreatePackageUseCase } from './create-package-use-case';
import { GetAllPackagesUseCase } from './get-all-packages-use-case';
import { GetCreatedPackagesUseCase } from './get-created-packages-use-case';
import { GetPackageByIdUseCase } from './get-package-by-id-use-case';
import { GetUserPackagesUseCase } from './get-user-packages-use-case';
import { RejectCollectionUseCase } from './reject-collection-use-case';
import { SendCollectionConfirmationUseCase } from './send-collection-confirmation-use-case';
import { UpdatePackageUseCase } from './update-package-use-case';

export const PACKAGE_USE_CASES = [
  CreatePackageUseCase,
  GetCreatedPackagesUseCase,
  GetPackageByIdUseCase,
  UpdatePackageUseCase,
  GetUserPackagesUseCase,
  GetAllPackagesUseCase,
  SendCollectionConfirmationUseCase,
  ConfirmCollectionUseCase,
  RejectCollectionUseCase,
];

export { ConfirmCollectionUseCase } from './confirm-collection-use-case';
export { SendCollectionConfirmationUseCase } from './send-collection-confirmation-use-case';

export { GetUserPackagesUseCase } from './get-user-packages-use-case';
export { GetAllPackagesUseCase } from './get-all-packages-use-case';
