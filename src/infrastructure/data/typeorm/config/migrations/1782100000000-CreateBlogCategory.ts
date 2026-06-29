import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlogCategory1782100000000 implements MigrationInterface {
  name = 'CreateBlogCategory1782100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."blog_category_status_enum" AS ENUM('ACTIVE', 'INACTIVE')
    `);

    await queryRunner.query(`
      CREATE TABLE "blog_category" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title"      character varying(255) NOT NULL,
        "slug"       character varying(255) NOT NULL,
        "status"     "public"."blog_category_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_blog_category" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_blog_category_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_BLOG_CATEGORY_SLUG" ON "blog_category" ("slug")
    `);

    await queryRunner.query(`
      CREATE TABLE "blog_post_categories" (
        "post_id"     uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_blog_post_categories" PRIMARY KEY ("post_id", "category_id"),
        CONSTRAINT "FK_blog_post_categories_post" FOREIGN KEY ("post_id")
          REFERENCES "blog_post"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_blog_post_categories_category" FOREIGN KEY ("category_id")
          REFERENCES "blog_category"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_blog_post_categories_post" ON "blog_post_categories" ("post_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_blog_post_categories_category" ON "blog_post_categories" ("category_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "blog_post_categories"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_BLOG_CATEGORY_SLUG"`);
    await queryRunner.query(`DROP TABLE "blog_category"`);
    await queryRunner.query(`DROP TYPE "public"."blog_category_status_enum"`);
  }
}
