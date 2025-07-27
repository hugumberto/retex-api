import { EntitySchema } from 'typeorm';
import { Address } from '../../../../domain/package/address.entity';

export const addressEmbedded = new EntitySchema<Address>({
  name: 'address',
  columns: {
    street: {
      type: 'varchar',
      length: 255,
      name: 'street',
    },
    number: {
      type: 'varchar',
      length: 20,
      name: 'number',
    },
    complement: {
      type: 'varchar',
      length: 255,
      nullable: true,
      name: 'complement',
    },
    city: {
      type: 'varchar',
      length: 255,
      name: 'city',
    },
    cityDivision: {
      type: 'varchar',
      length: 255,
      name: 'city_division',
    },
    country: {
      type: 'varchar',
      length: 255,
      name: 'country',
    },
    countryDivision: {
      type: 'varchar',
      length: 255,
      name: 'country_division',
    },
    zipCode: {
      type: 'varchar',
      length: 20,
      name: 'zip_code',
    },
    lat: {
      type: 'decimal',
      precision: 10,
      scale: 8,
      name: 'lat',
    },
    long: {
      type: 'decimal',
      precision: 11,
      scale: 8,
      name: 'long',
    },
  },
}); 