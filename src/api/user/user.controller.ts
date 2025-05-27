import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUserUseCase } from '../../app/use-cases/user/create-user-use-case';
import { CreateUserDto } from '../../app/use-cases/user/create-user-use-case/create-user.dto';
import { GetUserByIdUseCase } from '../../app/use-cases/user/get-user-by-id-use-case';

@Controller('user')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  @Post()
  createUser(@Body() body: CreateUserDto) {
    return this.createUserUseCase.call(body);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.getUserByIdUseCase.call(id);
  }
}
