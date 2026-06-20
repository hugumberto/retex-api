import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockDeep } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { User } from '../../../../domain/user/user.entity';
import { BaseRepository } from '../abstraction/base.repository';
import { UserRepository } from './user.repository';
import { userSchema } from './user.schema';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  const repositoryMock = mockDeep<Repository<User>>();
  const localStorageServiceMock = mockDeep<ILocalStorageService>();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(userSchema),
          useValue: repositoryMock,
        },
        {
          provide: SERVICE_TOKENS.LOCAL_STORAGE_SERVICE,
          useValue: localStorageServiceMock,
        },
      ],
    }).compile();

    userRepository = module.get(UserRepository);
  });

  it('should be extended from BaseRepository', () => {
    expect(userRepository).toBeInstanceOf(BaseRepository);
  });
});
