import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemParameter1783800000000 implements MigrationInterface {
  name = 'CreateSystemParameter1783800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "system_parameter" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "collection_confirmation_deadline_days" integer NOT NULL DEFAULT 2,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_system_parameter" PRIMARY KEY ("id")
      )
    `);
    // Linha única de parâmetros com o default.
    await queryRunner.query(
      `INSERT INTO "system_parameter" ("collection_confirmation_deadline_days") VALUES (2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "system_parameter"`);
  }
}
