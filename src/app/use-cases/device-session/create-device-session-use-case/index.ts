import { Inject, Injectable } from '@nestjs/common';
import { DeviceSession } from '../../../../domain/device-session/device-session.entity';
import { IDeviceSessionRepository } from '../../../../domain/device-session/device-session.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateDeviceSessionDto } from './create-device-session.dto';

export { CreateDeviceSessionDto };

export interface CreateDeviceSessionParam extends CreateDeviceSessionDto {
  userId: string;
}

@Injectable()
export class CreateDeviceSessionUseCase implements IUseCase<CreateDeviceSessionParam, DeviceSession> {
  constructor(
    @Inject(DOMAIN_TOKENS.DEVICE_SESSION_REPOSITORY)
    private readonly deviceSessionRepository: IDeviceSessionRepository,
  ) {}

  async call(param: CreateDeviceSessionParam): Promise<DeviceSession> {
    const existing = await this.deviceSessionRepository.find({ userId: param.userId });
    for (const session of existing) {
      await this.deviceSessionRepository.update({ id: session.id }, { active: false });
    }
    return this.deviceSessionRepository.create({
      userId: param.userId,
      deviceId: param.deviceId,
      deviceLabel: param.deviceLabel,
      active: true,
    });
  }
}
