import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateCollectionRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @IsInt({ message: 'Estimativa de sacos deve ser um número inteiro' })
  @Min(1, { message: 'Estimativa de sacos deve ser pelo menos 1' })
  estimatedBags: number;
}
