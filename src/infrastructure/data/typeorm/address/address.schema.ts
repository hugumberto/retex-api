import { EntitySchema } from 'typeorm';
import { Address } from '../../../../domain/address/address.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const addressSchema = new EntitySchema<Address>({
  name: 'user_address',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    userId: {
      type: 'uuid',
      nullable: false,
      name: 'user_id',
    },
    street: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'street',
    },
    number: {
      type: 'varchar',
      nullable: false,
      length: 20,
      name: 'number',
    },
    complement: {
      type: 'varchar',
      nullable: true,
      length: 255,
      name: 'complement',
    },
    city: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'city',
    },
    cityDivision: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'city_division',
    },
    country: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'country',
    },
    countryDivision: {
      type: 'varchar',
      nullable: false,
      length: 255,
      name: 'country_division',
    },
    zipCode: {
      type: 'varchar',
      nullable: false,
      length: 20,
      name: 'zip_code',
    },
    lat: {
      type: 'decimal',
      nullable: false,
      precision: 10,
      scale: 8,
      name: 'lat',
    },
    long: {
      type: 'decimal',
      nullable: false,
      precision: 11,
      scale: 8,
      name: 'long',
    },
    isDefault: {
      type: 'boolean',
      nullable: false,
      default: false,
      name: 'is_default',
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
      inverseSide: 'addresses',
      onDelete: 'CASCADE',
    },
  },
});
