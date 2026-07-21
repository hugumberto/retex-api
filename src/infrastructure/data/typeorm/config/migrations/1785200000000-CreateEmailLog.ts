import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailLog1785200000000 implements MigrationInterface {
  name = 'CreateEmailLog1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "email_log_status_enum" AS ENUM ('SENT', 'FAILED')
    `);
    await queryRunner.query(`
      CREATE TABLE "email_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "subject" character varying NOT NULL,
        "recipient" character varying NOT NULL,
        "user_id" uuid,
        "status" "email_log_status_enum" NOT NULL,
        "error" text,
        "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_email_log" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_email_log_type" ON "email_log" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_log_user_id" ON "email_log" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_log_sent_at" ON "email_log" ("sent_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_email_log_sent_at"`);
    await queryRunner.query(`DROP INDEX "IDX_email_log_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_email_log_type"`);
    await queryRunner.query(`DROP TABLE "email_log"`);
    await queryRunner.query(`DROP TYPE "email_log_status_enum"`);
  }
}
