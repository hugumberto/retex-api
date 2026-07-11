import { EntitySchema } from 'typeorm';
import { AgeGroup, Quality, Season, Sex, Type } from '../../../../domain/item/item.entity';
import { StorageUnit, StorageUnitStatus } from '../../../../domain/storage-unit/storage-unit.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const storageUnitSchema = new EntitySchema<StorageUnit>({
  name: 'storage_unit',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    friendlyCode: {
      type: 'varchar',
      length: 32,
      nullable: true,
      unique: true,
      name: 'friendly_code',
    },
    quality: {
      type: 'enum',
      enum: Quality,
      nullable: false,
    },
    sex: {
      type: 'enum',
      enum: Sex,
      nullable: false,
    },
    ageGroup: {
      name: 'age_group',
      type: 'enum',
      enum: AgeGroup,
      nullable: false,
    },
    type: {
      type: 'enum',
      enum: Type,
      nullable: false,
    },
    season: {
      type: 'enum',
      enum: Season,
      nullable: false,
    },
    status: {
      type: 'enum',
      enum: StorageUnitStatus,
      nullable: false,
      default: StorageUnitStatus.ATIVO,
    },
    weight: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    ...BaseTimestampColumns,
  },
});