import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQrCode1783400000000 implements MigrationInterface {
  name = 'CreateQrCode1783400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "qr_code" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token" character varying NOT NULL,
        "friendly_code" character varying NOT NULL,
        "batch_id" uuid NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_qr_code_token" UNIQUE ("token"),
        CONSTRAINT "UQ_qr_code_friendly_code" UNIQUE ("friendly_code"),
        CONSTRAINT "PK_qr_code" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "qr_code"`);
  }
}
