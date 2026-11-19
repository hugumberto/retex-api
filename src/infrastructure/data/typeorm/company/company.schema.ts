import { EntitySchema } from 'typeorm';
import {
  Company,
  CompanyKind,
  CompanyStatus,
} from '../../../../domain/company/company.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const companySchema = new EntitySchema<Company>({
  name: 'company',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    legalName: {
      type: 'varchar',
      length: 255,
      nullable: true,
      name: 'legal_name',
    },
    taxId: {
      type: 'varchar',
      length: 32,
      nullable: false,
      unique: true,
      name: 'tax_id',
    },
    email: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    phone: {
      type: 'varchar',
      length: 20,
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: CompanyStatus,
      nullable: false,
      default: CompanyStatus.ACTIVE,
    },
    kind: {
      type: 'enum',
      enum: CompanyKind,
      enumName: 'company_kind_enum',
      nullable: false,
      default: CompanyKind.COMPANY,
    },
    friendlyCode: {
      type: 'varchar',
      length: 32,
      nullable: true,
      unique: true,
      name: 'friendly_code',
    },
    ...BaseTimestampColumns,
  },
  relations: {
    members: {
      type: 'one-to-many',
      target: 'company_member',
      inverseSide: 'company',
    },
  },
  indices: [
    {
      name: 'IDX_COMPANY_TAX_ID',
      columns: ['taxId'],
      unique: true,
    },
  ],
});
