import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToStorageUnit1783900000000 implements MigrationInterface {
  name = 'AddStatusToStorageUnit1783900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_status_enum" AS ENUM('ATIVO', 'INATIVO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "status" "public"."storage_unit_status_enum" NOT NULL DEFAULT 'ATIVO'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."storage_unit_status_enum"`);
  }
}
