import { AddRoleToUserUseCase } from './add-role-to-user-use-case';
import { CreateUserUseCase } from './create-user-use-case';
import { GetAllUsersUseCase } from './get-all-users-use-case';
import { GetUserByIdUseCase } from './get-user-by-id-use-case';
import { UpdateUserUseCase } from './update-user-use-case';

export const USER_USE_CASES = [
  CreateUserUseCase,
  GetUserByIdUseCase,
  GetAllUsersUseCase,
  UpdateUserUseCase,
  AddRoleToUserUseCase,
];

export * from './add-role-to-user-use-case';
export * from './create-user-use-case';
export * from './get-all-users-use-case';
export * from './get-user-by-id-use-case';
export * from './update-user-use-case';

