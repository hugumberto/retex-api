import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFriendlyCodeToPackage1784000000000
  implements MigrationInterface
{
  name = 'AddFriendlyCodeToPackage1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package" ADD "friendly_code" character varying(32)`,
    );

    // Backfill: gera um código amigável (`ano-XXXXXX`, alfabeto sem ambíguos)
    // único para cada solicitação já existente, baseado no ano de criação.
    await queryRunner.query(`
      DO $$
      DECLARE
        r RECORD;
        chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        code TEXT;
        yr TEXT;
        i INT;
      BEGIN
        FOR r IN SELECT id, created_at FROM "package" WHERE friendly_code IS NULL LOOP
          yr := EXTRACT(YEAR FROM COALESCE(r.created_at, now()))::int::text;
          LOOP
            code := yr || '-';
            FOR i IN 1..6 LOOP
              code := code || substr(chars, floor(random() * length(chars))::int + 1, 1);
            END LOOP;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM "package" WHERE friendly_code = code);
          END LOOP;
          UPDATE "package" SET friendly_code = code WHERE id = r.id;
        END LOOP;
      END $$;
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_PACKAGE_FRIENDLY_CODE" ON "package" ("friendly_code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_PACKAGE_FRIENDLY_CODE"`);
    await queryRunner.query(
      `ALTER TABLE "package" DROP COLUMN "friendly_code"`,
    );
  }
}
