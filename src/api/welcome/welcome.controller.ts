import { Controller, Get } from '@nestjs/common';
import { GetWelcomeUseCase } from '../../app/use-cases/welcome/get-welcome-use-case';

@Controller()
export class WelcomeController {
  constructor(private readonly getWelcomeUseCase: GetWelcomeUseCase) {}

  @Get()
  getWelcome() {
    return this.getWelcomeUseCase.call();
  }
}
