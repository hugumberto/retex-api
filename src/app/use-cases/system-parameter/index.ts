import { GetSystemParametersUseCase } from './get-system-parameters-use-case';
import { UpdateSystemParametersUseCase } from './update-system-parameters-use-case';

export const SYSTEM_PARAMETER_USE_CASES = [
  GetSystemParametersUseCase,
  UpdateSystemParametersUseCase,
];

export * from './get-system-parameters-use-case';
export * from './update-system-parameters-use-case';
