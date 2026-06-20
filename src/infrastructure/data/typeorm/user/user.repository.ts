import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { userSchema } from './user.schema';

@Injectable()
export class UserRepository
  extends BaseRepository<User>
  implements IUserRepository {
  constructor(
    @InjectRepository(userSchema)
    userRepository: Repository<User>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(userRepository, localStorageService);
  }

  async findOneWithRelations(query: Partial<User>): Promise<User> {
    const repository = await this.getRepository();
    const normalizedQuery = this.normalizeQuery(query);
    return repository.findOne({
      where: normalizedQuery as FindOptionsWhere<User>,
      relations: ['roles'],
    });
  }

  async findWithRelations(query: Partial<User>, options?: { role?: Role }): Promise<User[]> {
    const repository = await this.getRepository();
    const normalizedQuery = this.normalizeQuery(query);

    const where: any = normalizedQuery;

    if (options?.role) {
      where.roles = { role: options.role };
    }

    return repository.find({
      where: where as FindOptionsWhere<User>,
      relations: ['roles'],
    });
  }

  async findInactiveUsersByCity(sanitizedCity: string): Promise<User[]> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('u')
      .innerJoin('user_address', 'a', 'a.user_id = u.id AND a.is_default = true')
      .where('u.status = :status', { status: UserStatus.INACTIVE })
      .andWhere('a.city_normalized = :city', { city: sanitizedCity })
      .getMany();
  }

  // Os tokens têm `select: false` (não vazam em leituras normais); aqui
  // re-incluímos os campos necessários para validar a expiração.
  async findByActivationToken(token: string): Promise<User | null> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('u')
      .addSelect(['u.activationToken', 'u.activationTokenExpiresAt'])
      .where('u.activationToken = :token', { token })
      .getOne();
  }

  async findByResetToken(token: string): Promise<User | null> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('u')
      .addSelect(['u.resetTokenExpiresAt'])
      .where('u.resetToken = :token', { token })
      .getOne();
  }
}
