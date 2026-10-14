import { EntitySchema } from 'typeorm';
import { Season, Type } from '../../../../domain/item/item.entity';
import {
  StorageGroup,
  StorageUnit,
  StorageUnitStatus,
} from '../../../../domain/storage-unit/storage-unit.entity';
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
    // `group` é palavra reservada em SQL; a coluna chama-se storage_group.
    group: {
      name: 'storage_group',
      type: 'enum',
      enum: StorageGroup,
      enumName: 'storage_unit_group_enum',
      nullable: false,
    },
    // Nulos apenas no lote NON_REUSABLE.
    type: {
      type: 'enum',
      enum: Type,
      nullable: true,
    },
    season: {
      type: 'enum',
      enum: Season,
      nullable: true,
    },
    location: {
      type: 'varchar',
      length: 100,
      nullable: true,
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
    // Contador denormalizado de itens associados (mantido no bind/delete),
    // para leitura O(1) sem contar a tabela item a cada consulta.
    itemsCount: {
      type: 'integer',
      nullable: false,
      default: 0,
      name: 'items_count',
    },
    ...BaseTimestampColumns,
  },
  checks: [
    {
      // Lotes de reutilização têm estação e parte; o não reutilizável nenhuma.
      name: 'CHK_STORAGE_UNIT_SLOT',
      expression: `("storage_group" = 'NON_REUSABLE' AND "season" IS NULL AND "type" IS NULL) OR ("storage_group" <> 'NON_REUSABLE' AND "season" IS NOT NULL AND "type" IS NOT NULL)`,
    },
  ],
  relations: {
    items: {
      type: 'one-to-many',
      target: 'item',
      inverseSide: 'storageUnit',
    },
  },
});