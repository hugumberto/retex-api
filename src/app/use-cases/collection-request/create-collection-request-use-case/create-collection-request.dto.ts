import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RegisterAddressDto } from '../../user/register-user-use-case/register-user.dto';

/**
 * Duas formas de criar uma solicitação, distinguidas pela presença de `address`:
 *
 * 1. **Cliente existente** — `userId` + `addressId`. É o que o portal envia
 *    quando o próprio cliente pede a recolha, escolhendo uma das suas moradas.
 * 2. **Cliente ao balcão** — dados do cliente e da morada em texto. É o que o
 *    ecrã do operador envia: ele tem a pessoa ao telefone e não tem forma de
 *    descobrir ids. Reservada a ADMIN/OPS, pelo controller.
 */
export class CreateCollectionRequestDto {
  @ValidateIf((o) => !o.address)
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ValidateIf((o) => !o.address)
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  // ── cliente ao balcão ───────────────────────────────────────────────────────

  @ValidateIf((o) => !o.addressId)
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  firstName?: string;

  @ValidateIf((o) => !o.addressId)
  @IsString({ message: 'Sobrenome deve ser uma string' })
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  lastName?: string;

  @ValidateIf((o) => !o.addressId)
  @IsEmail({}, { message: 'Email deve ser válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ValidateIf((o) => !o.addressId)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RegisterAddressDto)
  address?: RegisterAddressDto;

  // ── comum ───────────────────────────────────────────────────────────────────

  @IsInt({ message: 'Estimativa de sacos deve ser um número inteiro' })
  @Min(1, { message: 'Estimativa de sacos deve ser pelo menos 1' })
  estimatedBags: number;
}
