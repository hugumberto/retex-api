import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivationTokenToUser1782200000000 implements MigrationInterface {
  name = 'AddActivationTokenToUser1782200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "activation_token" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "activation_token_expires_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_USER_ACTIVATION_TOKEN" ON "user" ("activation_token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_USER_ACTIVATION_TOKEN"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "activation_token_expires_at"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "activation_token"`);
  }
}
