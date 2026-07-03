import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSexAndAgeGroupToItem1783200000000
  implements MigrationInterface
{
  name = 'AddSexAndAgeGroupToItem1783200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."item_sex_enum" AS ENUM('MALE', 'FEMALE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."item_age_group_enum" AS ENUM('ADULT', 'CHILD')`,
    );

    // Add as NOT NULL with a temporary default to backfill existing rows, then
    // drop the default so the columns match the entity schema (no default).
    await queryRunner.query(
      `ALTER TABLE "item" ADD "sex" "public"."item_sex_enum" NOT NULL DEFAULT 'MALE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD "age_group" "public"."item_age_group_enum" NOT NULL DEFAULT 'ADULT'`,
    );

    await queryRunner.query(
      `ALTER TABLE "item" ALTER COLUMN "sex" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ALTER COLUMN "age_group" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "age_group"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "sex"`);
    await queryRunner.query(`DROP TYPE "public"."item_age_group_enum"`);
    await queryRunner.query(`DROP TYPE "public"."item_sex_enum"`);
  }
}
