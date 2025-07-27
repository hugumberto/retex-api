import { Controller, Get, Param } from '@nestjs/common';
import { GetUserByIdUseCase } from '../../app/use-cases/user/get-user-by-id-use-case';

@Controller('user')
export class UserController {
  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) { }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.getUserByIdUseCase.call(id);
  }
}
