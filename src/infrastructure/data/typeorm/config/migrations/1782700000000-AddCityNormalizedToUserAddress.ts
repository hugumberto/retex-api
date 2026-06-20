import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * As moradas guardam a cidade em bruto (com acentos), mas as zonas de atuação
 * são guardadas normalizadas (sem acentos, minúsculas). O casamento por
 * `LOWER(city)` nunca acertava em cidades acentuadas (ex.: "São Paulo"). Aqui
 * adicionamos `city_normalized` e fazemos backfill com a MESMA lógica do
 * `SanitizationService.sanitizeString` para garantir paridade com os novos
 * registos.
 */
export class AddCityNormalizedToUserAddress1782700000000
  implements MigrationInterface
{
  name = 'AddCityNormalizedToUserAddress1782700000000';

  // Espelha SanitizationService.sanitizeString — manter em sincronia.
  private normalize(value: string): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toLowerCase()
      .trim();
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD COLUMN IF NOT EXISTS "city_normalized" character varying(255) NOT NULL DEFAULT ''`,
    );

    const rows: Array<{ id: string; city: string }> = await queryRunner.query(
      `SELECT "id", "city" FROM "user_address"`,
    );
    for (const row of rows) {
      await queryRunner.query(
        `UPDATE "user_address" SET "city_normalized" = $1 WHERE "id" = $2`,
        [this.normalize(row.city), row.id],
      );
    }

    await queryRunner.query(
      `CREATE INDEX "IDX_user_address_city_normalized" ON "user_address" ("city_normalized")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_user_address_city_normalized"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP COLUMN IF EXISTS "city_normalized"`,
    );
  }
}
