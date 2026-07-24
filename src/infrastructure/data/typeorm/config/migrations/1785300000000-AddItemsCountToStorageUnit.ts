import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddItemsCountToStorageUnit1785300000000
  implements MigrationInterface
{
  name = 'AddItemsCountToStorageUnit1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD COLUMN IF NOT EXISTS "items_count" integer NOT NULL DEFAULT 0`,
    );
    // Índice para contagem/filtragem eficiente de itens por unidade.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_item_storage_unit_id" ON "item" ("storage_unit_id")`,
    );
    // Backfill do contador a partir dos itens ativos já vinculados.
    await queryRunner.query(`
      UPDATE "storage_unit" su
      SET "items_count" = sub.count
      FROM (
        SELECT storage_unit_id AS id, COUNT(*)::int AS count
        FROM "item"
        WHERE storage_unit_id IS NOT NULL AND deleted_at IS NULL
        GROUP BY storage_unit_id
      ) sub
      WHERE su.id = sub.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_item_storage_unit_id"`);
    await queryRunner.query(
      `ALTER TABLE "storage_unit" DROP COLUMN IF EXISTS "items_count"`,
    );
  }
}
