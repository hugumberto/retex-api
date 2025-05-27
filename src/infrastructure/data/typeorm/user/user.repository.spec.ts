import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockDeep } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { User } from '../../../../domain/user/user.entity';
import { BaseRepository } from '../abstraction/base.repository';
import { UserRepository } from './user.repository';
import { userSchema } from './user.schema';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  const repositoryMock = mockDeep<Repository<User>>();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(userSchema),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    userRepository = module.get(UserRepository);
  });

  it('should be extended from BaseRepository', () => {
    expect(userRepository).toBeInstanceOf(BaseRepository);
  });
});
