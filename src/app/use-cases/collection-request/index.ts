import { ConfirmCollectionUseCase } from './confirm-collection-use-case';
import { CreateCollectionRequestUseCase } from './create-collection-request-use-case';
import { GetAllCollectionRequestsUseCase } from './get-all-collection-requests-use-case';
import { GetCollectionRequestByIdUseCase } from './get-collection-request-by-id-use-case';
import { GetCollectionRequestDetailUseCase } from './get-collection-request-detail-use-case';
import { GetUserCollectionRequestsUseCase } from './get-user-collection-requests-use-case';
import { RejectCollectionUseCase } from './reject-collection-use-case';
import { SendCollectionConfirmationUseCase } from './send-collection-confirmation-use-case';
import { UpdateCollectionRequestUseCase } from './update-collection-request-use-case';

export const COLLECTION_REQUEST_USE_CASES = [
  CreateCollectionRequestUseCase,
  GetCollectionRequestByIdUseCase,
  GetCollectionRequestDetailUseCase,
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
export { GetCollectionRequestDetailUseCase } from './get-collection-request-detail-use-case';
