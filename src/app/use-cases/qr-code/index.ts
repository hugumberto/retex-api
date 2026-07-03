import { GenerateQrCodesUseCase } from './generate-qr-codes-use-case';
import { MarkQrCodeUsedUseCase } from './mark-qr-code-used-use-case';

export const QR_CODE_USE_CASES = [
  GenerateQrCodesUseCase,
  MarkQrCodeUsedUseCase,
];

export * from './generate-qr-codes-use-case';
export * from './mark-qr-code-used-use-case';
