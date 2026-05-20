import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

export interface DeactivateSubUserParamDto {
  parentId: string;
  subUserId: string;
}

@Injectable()
export class DeactivateSubUserUseCase implements IUseCase<DeactivateSubUserParamDto, Omit<User, 'password'>> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) { }

  async call(param: DeactivateSubUserParamDto): Promise<Omit<User, 'password'>> {
    const { parentId, subUserId } = param;

    const subUser = await this.userRepository.findOne({ id: subUserId });
    if (!subUser) {
      throw new NotFoundException('Sub-usuário não encontrado');
    }

    if (subUser.parentId !== parentId) {
      throw new ForbiddenException('Acesso negado');
    }

    const [updated] = await this.userRepository.update(
      { id: subUserId },
      { status: UserStatus.INACTIVE },
    );

    const { password, ...rest } = updated;
    return rest;
  }
}
