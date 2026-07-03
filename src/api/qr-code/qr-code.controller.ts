import { Body, Controller, Patch, Post } from '@nestjs/common';
import {
  GenerateQrCodesDto,
  GenerateQrCodesUseCase,
  MarkQrCodeUsedDto,
  MarkQrCodeUsedUseCase,
} from '../../app/use-cases/qr-code';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('qr-code')
@Roles(Role.ADMIN, Role.OPS, Role.DRIVER)
export class QrCodeController {
  constructor(
    private readonly generateQrCodesUseCase: GenerateQrCodesUseCase,
    private readonly markQrCodeUsedUseCase: MarkQrCodeUsedUseCase,
  ) { }

  @Post('generate')
  async generate(@Body() dto: GenerateQrCodesDto) {
    return this.generateQrCodesUseCase.call(dto);
  }

  @Patch('use')
  async markUsed(@Body() dto: MarkQrCodeUsedDto) {
    return this.markQrCodeUsedUseCase.call(dto);
  }
}
