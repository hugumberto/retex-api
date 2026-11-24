import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * O contador de peças dos lotes contava linhas registadas (uma linha
 * "2 calças" somava 1). Passa a contar peças: soma-se a cada lote a diferença
 * entre peças e linhas das peças lá guardadas. Não se recalcula do zero para
 * não mexer em lotes com contagens antigas sem peças registadas.
 */
export class StorageUnitItemsCountInPieces1787300000000 implements MigrationInterface {
  name = 'StorageUnitItemsCountInPieces1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE storage_unit su
         SET items_count = su.items_count + x.extra
        FROM (
          SELECT storage_unit_id, SUM(quantity) - COUNT(*) AS extra
            FROM item
           WHERE deleted_at IS NULL AND storage_unit_id IS NOT NULL
           GROUP BY storage_unit_id
          HAVING SUM(quantity) <> COUNT(*)
        ) x
       WHERE su.id = x.storage_unit_id`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE storage_unit su
         SET items_count = GREATEST(su.items_count - x.extra, 0)
        FROM (
          SELECT storage_unit_id, SUM(quantity) - COUNT(*) AS extra
            FROM item
           WHERE deleted_at IS NULL AND storage_unit_id IS NOT NULL
           GROUP BY storage_unit_id
          HAVING SUM(quantity) <> COUNT(*)
        ) x
       WHERE su.id = x.storage_unit_id`);
  }
}
