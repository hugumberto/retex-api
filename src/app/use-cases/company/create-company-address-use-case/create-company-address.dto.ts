import { OmitType } from '@nestjs/swagger';
import { CreateAddressDto } from '../../address/create-address-use-case/create-address.dto';

// Mesma morada das pessoais, menos o dono e o `isDefault`: uma morada de
// empresa pertence à empresa e não há conceito de "principal" por membro.
export class CreateCompanyAddressDto extends OmitType(CreateAddressDto, [
  'userId',
  'isDefault',
] as const) {}
