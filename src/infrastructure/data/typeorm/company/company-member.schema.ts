import { EntitySchema } from 'typeorm';
import {
  CompanyMember,
  CompanyMemberStatus,
} from '../../../../domain/company/company-member.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const companyMemberSchema = new EntitySchema<CompanyMember>({
  name: 'company_member',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    userId: {
      type: 'uuid',
      nullable: false,
      unique: true,
      name: 'user_id',
    },
    companyId: {
      type: 'uuid',
      nullable: false,
      name: 'company_id',
    },
    profileId: {
      type: 'uuid',
      nullable: false,
      name: 'profile_id',
    },
    status: {
      type: 'enum',
      enum: CompanyMemberStatus,
      nullable: false,
      default: CompanyMemberStatus.ACTIVE,
    },
    ...BaseTimestampColumns,
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'user',
      joinColumn: {
        name: 'user_id',
      },
      nullable: false,
    },
    company: {
      type: 'many-to-one',
      target: 'company',
      joinColumn: {
        name: 'company_id',
      },
      nullable: false,
      inverseSide: 'members',
    },
    profile: {
      type: 'many-to-one',
      target: 'company_profile',
      joinColumn: {
        name: 'profile_id',
      },
      nullable: false,
    },
  },
  indices: [
    {
      // Um utilizador pertence a no máximo uma empresa.
      name: 'IDX_COMPANY_MEMBER_USER',
      columns: ['userId'],
      unique: true,
    },
    {
      name: 'IDX_COMPANY_MEMBER_COMPANY',
      columns: ['companyId'],
    },
  ],
});
