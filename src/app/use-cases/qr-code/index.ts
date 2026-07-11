import { GenerateCollectionQrCodesUseCase } from './generate-collection-qr-codes-use-case';
import { GetRouteQrCodesUseCase } from './get-route-qr-codes-use-case';

export const QR_CODE_USE_CASES = [
  GenerateCollectionQrCodesUseCase,
  GetRouteQrCodesUseCase,
];

export * from './generate-collection-qr-codes-use-case';
export * from './get-route-qr-codes-use-case';
