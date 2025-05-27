import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetWelcomeUseCase implements IUseCase<void, { message: string }> {
  async call(): Promise<{ message: string }> {
    return {
      message: 'Welcome to Retex API 😎',
    };
  }
}
