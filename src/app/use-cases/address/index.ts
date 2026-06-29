import { CreateAddressUseCase } from './create-address-use-case';
import { DeleteAddressUseCase } from './delete-address-use-case';
import { GetUserAddressesUseCase } from './get-user-addresses-use-case';
import { SetDefaultAddressUseCase } from './set-default-address-use-case';

export const ADDRESS_USE_CASES = [
  CreateAddressUseCase,
  GetUserAddressesUseCase,
  SetDefaultAddressUseCase,
  DeleteAddressUseCase,
];

export * from './create-address-use-case';
export * from './delete-address-use-case';
export * from './get-user-addresses-use-case';
export * from './set-default-address-use-case';
