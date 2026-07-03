import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSortingAttributesToStorageUnit1783100000000
  implements MigrationInterface
{
  name = 'AddSortingAttributesToStorageUnit1783100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_sex_enum" AS ENUM('MALE', 'FEMALE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_age_group_enum" AS ENUM('ADULT', 'CHILD')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_type_enum" AS ENUM('UPPER_PART', 'UNDER_PART')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_season_enum" AS ENUM('SUMMER', 'WINTER')`,
    );

    // Add as NOT NULL with a temporary default to backfill existing rows, then
    // drop the default so the columns match the entity schema (no default).
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "sex" "public"."storage_unit_sex_enum" NOT NULL DEFAULT 'MALE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "age_group" "public"."storage_unit_age_group_enum" NOT NULL DEFAULT 'ADULT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "type" "public"."storage_unit_type_enum" NOT NULL DEFAULT 'UPPER_PART'`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "season" "public"."storage_unit_season_enum" NOT NULL DEFAULT 'SUMMER'`,
    );

    await queryRunner.query(
      `ALTER TABLE "storage_unit" ALTER COLUMN "sex" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ALTER COLUMN "age_group" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ALTER COLUMN "season" DROP DEFAULT`,
    );

    // Remove the brand relation from storage units.
    await queryRunner.query(
      `ALTER TABLE "storage_unit" DROP CONSTRAINT "FK_99c0cfaf3018000ea91e8a388ca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" DROP COLUMN "brand_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "brand_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD CONSTRAINT "FK_99c0cfaf3018000ea91e8a388ca" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "season"`);
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "type"`);
    await queryRunner.query(
      `ALTER TABLE "storage_unit" DROP COLUMN "age_group"`,
    );
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "sex"`);

    await queryRunner.query(`DROP TYPE "public"."storage_unit_season_enum"`);
    await queryRunner.query(`DROP TYPE "public"."storage_unit_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."storage_unit_age_group_enum"`);
    await queryRunner.query(`DROP TYPE "public"."storage_unit_sex_enum"`);
  }
}
