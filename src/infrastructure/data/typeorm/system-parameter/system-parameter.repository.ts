import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { SystemParameter } from '../../../../domain/system-parameter/system-parameter.entity';
import { ISystemParameterRepository } from '../../../../domain/system-parameter/system-parameter.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { systemParameterSchema } from './system-parameter.schema';

@Injectable()
export class SystemParameterRepository
  extends BaseRepository<SystemParameter>
  implements ISystemParameterRepository
{
  constructor(
    @InjectRepository(systemParameterSchema)
    systemParameterRepository: Repository<SystemParameter>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(systemParameterRepository, localStorageService);
  }

  async getSingleton(): Promise<SystemParameter> {
    const repository = await this.getRepository();
    return repository
      .createQueryBuilder('sp')
      .orderBy('sp.created_at', 'ASC')
      .getOne();
  }
}
