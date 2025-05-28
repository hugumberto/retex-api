import { Inject, Injectable } from '@nestjs/common';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { UserStatus } from '../../../../domain/user/user-status.enum';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class CreateUserUseCase implements IUseCase<CreateUserDto, { message: string } | User> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.TEST_ZONE_REPOSITORY)
    private readonly testZoneRepository: ITestZoneRepository,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
  ) {}

  async call(param: CreateUserDto): Promise<{ message: string } | User> {
    const sanitizedNif = this.sanitizationService.sanitizeNumericString(param.nif);
    const existingUser = await this.userRepository.findOne({ nif: sanitizedNif });

    if (existingUser) {
      return { message: 'Usuário já cadastrado com sucesso' };
    }

    const sanitizedCity = this.sanitizationService.sanitizeString(param.address.city);
    const testZone = await this.testZoneRepository.findByCity(sanitizedCity);

    const sanitizedData = {
      ...param,
      nif: sanitizedNif,
      status: testZone ? UserStatus.INSIDE_TEST_ZONE : UserStatus.OUTSIDE_TEST_ZONE,
      contactPhone: this.sanitizationService.sanitizeNumericString(param.contactPhone),
      address: {
        ...param.address,
        city: param.address.city,
        zipCode: this.sanitizationService.sanitizeNumericString(param.address.zipCode),
        lat: this.sanitizationService.sanitizeCoordinate(param.address.lat),
        long: this.sanitizationService.sanitizeCoordinate(param.address.long),
      },
    };

    return this.userRepository.create(sanitizedData);
  }
}
