import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetTokenToUser1782400000000 implements MigrationInterface {
  name = 'AddResetTokenToUser1782400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "reset_token" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "reset_token_expires_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_USER_RESET_TOKEN" ON "user" ("reset_token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_USER_RESET_TOKEN"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "reset_token_expires_at"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "reset_token"`);
  }
}
