import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { DeviceSession } from '../../../../domain/device-session/device-session.entity';
import { IDeviceSessionRepository } from '../../../../domain/device-session/device-session.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { deviceSessionSchema } from './device-session.schema';

@Injectable()
export class DeviceSessionRepository
  extends BaseRepository<DeviceSession>
  implements IDeviceSessionRepository
{
  constructor(
    @InjectRepository(deviceSessionSchema)
    deviceSessionRepository: Repository<DeviceSession>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(deviceSessionRepository, localStorageService);
  }
}
