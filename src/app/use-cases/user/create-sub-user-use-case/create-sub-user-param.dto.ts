import { CreateSubUserDto } from './create-sub-user.dto';

export class CreateSubUserParamDto {
  parentId: string;
  data: CreateSubUserDto;
}
