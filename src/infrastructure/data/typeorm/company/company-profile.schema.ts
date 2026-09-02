import { EntitySchema } from 'typeorm';
import { CompanyProfile } from '../../../../domain/company/company-profile.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const companyProfileSchema = new EntitySchema<CompanyProfile>({
  name: 'company_profile',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    // Null = perfil de sistema, disponível para todas as empresas.
    companyId: {
      type: 'uuid',
      nullable: true,
      name: 'company_id',
    },
    key: {
      type: 'varchar',
      length: 64,
      nullable: false,
    },
    name: {
      type: 'varchar',
      length: 128,
      nullable: false,
    },
    permissions: {
      type: 'jsonb',
      nullable: false,
      default: () => "'[]'::jsonb",
    },
    ...BaseTimestampColumns,
  },
  relations: {
    company: {
      type: 'many-to-one',
      target: 'company',
      joinColumn: {
        name: 'company_id',
      },
      nullable: true,
      onDelete: 'CASCADE',
    },
  },
});
