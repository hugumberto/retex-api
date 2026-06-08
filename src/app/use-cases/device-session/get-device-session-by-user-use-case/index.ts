import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DeviceSession } from '../../../../domain/device-session/device-session.entity';
import { IDeviceSessionRepository } from '../../../../domain/device-session/device-session.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

@Injectable()
export class GetDeviceSessionByUserUseCase implements IUseCase<string, DeviceSession> {
  constructor(
    @Inject(DOMAIN_TOKENS.DEVICE_SESSION_REPOSITORY)
    private readonly deviceSessionRepository: IDeviceSessionRepository,
  ) {}

  async call(userId: string): Promise<DeviceSession> {
    const session = await this.deviceSessionRepository.findOne({ userId, active: true });
    if (!session) throw new NotFoundException('Sessão de dispositivo não encontrada');
    return session;
  }
}
