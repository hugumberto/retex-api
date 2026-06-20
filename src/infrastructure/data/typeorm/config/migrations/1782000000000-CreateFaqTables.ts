import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFaqTables1782000000000 implements MigrationInterface {
  name = 'CreateFaqTables1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."faq_category_status_enum" AS ENUM('ACTIVE', 'INACTIVE')
    `);

    await queryRunner.query(`
      CREATE TABLE "faq_category" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title"      character varying(255) NOT NULL,
        "description" text NOT NULL,
        "status"     "public"."faq_category_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_faq_category" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "faq_item" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "category_id" uuid NOT NULL,
        "title"       character varying(255) NOT NULL,
        "description" text NOT NULL,
        "created_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_faq_item" PRIMARY KEY ("id"),
        CONSTRAINT "FK_faq_item_category" FOREIGN KEY ("category_id")
          REFERENCES "faq_category"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "faq_item"`);
    await queryRunner.query(`DROP TABLE "faq_category"`);
    await queryRunner.query(`DROP TYPE "public"."faq_category_status_enum"`);
  }
}
