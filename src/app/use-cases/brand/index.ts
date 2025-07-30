import { CreateBrandUseCase } from './create-brand-use-case';
import { DeleteBrandUseCase } from './delete-brand-use-case';
import { GetAllBrandsUseCase } from './get-all-brands-use-case';
import { GetBrandByIdUseCase } from './get-brand-by-id-use-case';
import { UpdateBrandUseCase } from './update-brand-use-case';

export const BRAND_USE_CASES = [
  CreateBrandUseCase,
  GetBrandByIdUseCase,
  GetAllBrandsUseCase,
  UpdateBrandUseCase,
  DeleteBrandUseCase,
];

export * from './create-brand-use-case';
export * from './delete-brand-use-case';
export * from './get-all-brands-use-case';
export * from './get-brand-by-id-use-case';
export * from './update-brand-use-case';
