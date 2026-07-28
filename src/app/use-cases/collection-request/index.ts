import { ConfirmCollectionUseCase } from './confirm-collection-use-case';
import { CreateCollectionRequestUseCase } from './create-collection-request-use-case';
import { GetAllCollectionRequestsUseCase } from './get-all-collection-requests-use-case';
import { GetCreatedCollectionRequestsUseCase } from './get-created-collection-requests-use-case';
import { GetCollectionRequestByIdUseCase } from './get-collection-request-by-id-use-case';
import { GetUserCollectionRequestsUseCase } from './get-user-collection-requests-use-case';
import { RejectCollectionUseCase } from './reject-collection-use-case';
import { SendCollectionConfirmationUseCase } from './send-collection-confirmation-use-case';
import { UpdateCollectionRequestUseCase } from './update-collection-request-use-case';

export const COLLECTION_REQUEST_USE_CASES = [
  CreateCollectionRequestUseCase,
  GetCreatedCollectionRequestsUseCase,
  GetCollectionRequestByIdUseCase,
  UpdateCollectionRequestUseCase,
  GetUserCollectionRequestsUseCase,
  GetAllCollectionRequestsUseCase,
  SendCollectionConfirmationUseCase,
  ConfirmCollectionUseCase,
  RejectCollectionUseCase,
];

export { ConfirmCollectionUseCase } from './confirm-collection-use-case';
export { SendCollectionConfirmationUseCase } from './send-collection-confirmation-use-case';

export { GetUserCollectionRequestsUseCase } from './get-user-collection-requests-use-case';
export { GetAllCollectionRequestsUseCase } from './get-all-collection-requests-use-case';
