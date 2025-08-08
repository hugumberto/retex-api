import { Test } from '@nestjs/testing';
import { GetWelcomeUseCase } from './index';

describe('GetWelcomeUseCase', () => {
  let getWelcomeUseCase: GetWelcomeUseCase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GetWelcomeUseCase],
    }).compile();

    getWelcomeUseCase = module.get(GetWelcomeUseCase);
  });

  describe('call', () => {
    it('should return an welcome message', async () => {
      const response = await getWelcomeUseCase.call();
      expect(response).toEqual({ message: 'Welcome to Retex API 😎' });
    });
  });
});
