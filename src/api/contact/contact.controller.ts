import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SendContactFormUseCase } from '../../app/use-cases/contact';
import { SendContactFormDto } from '../../app/use-cases/contact/send-contact-form-use-case/send-contact-form.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('contact')
@Controller('contact')
@Public()
export class ContactController {
  constructor(
    private readonly sendContactFormUseCase: SendContactFormUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar mensagem de contacto' })
  @ApiResponse({ status: 200, description: 'Mensagem enviada com sucesso' })
  sendContactForm(@Body() dto: SendContactFormDto): Promise<{ ok: true }> {
    return this.sendContactFormUseCase.call(dto);
  }
}
