import { Inject, Injectable } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { DirectoryKind, DirectoryPage, IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';

const KINDS: DirectoryKind[] = ['PERSON', 'COMPANY', 'MUNICIPALITY', 'DRIVER', 'TEAM'];

export class GetUserDirectoryDto {
  @IsOptional()
  @IsIn(KINDS)
  kind?: DirectoryKind;

  // Nome, email, NIF ou código postal.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export type UserDirectory = DirectoryPage & { page: number; limit: number };

/** Lista de Utilizadores: pessoas e entidades, com separadores e pesquisa. */
@Injectable()
export class GetUserDirectoryUseCase implements IUseCase<GetUserDirectoryDto, UserDirectory> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async call({ kind, q, page = 1, limit = 25 }: GetUserDirectoryDto): Promise<UserDirectory> {
    const result = await this.userRepository.directory({
      kind,
      q,
      limit,
      offset: (page - 1) * limit,
    });
    return { ...result, page, limit };
  }
}
