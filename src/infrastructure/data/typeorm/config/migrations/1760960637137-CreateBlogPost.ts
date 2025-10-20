import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBlogPost1760960637137 implements MigrationInterface {
    name = 'CreateBlogPost1760960637137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."blog_post_status_enum" AS ENUM('DRAFT', 'PUBLISHED')
        `);
        await queryRunner.query(`
            CREATE TABLE "blog_post" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "body" text NOT NULL,
                "slug" character varying(255) NOT NULL,
                "title" character varying(255) NOT NULL,
                "hero" text NOT NULL,
                "status" "public"."blog_post_status_enum" NOT NULL DEFAULT 'DRAFT',
                "highlight" integer NOT NULL DEFAULT '0',
                "tags" json NOT NULL DEFAULT '[]',
                "publish_date" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_7a1f994eda1ad6e18788ca90b9e" UNIQUE ("slug"),
                CONSTRAINT "PK_694e842ad1c2b33f5939de6fede" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_BLOG_POST_SLUG" ON "blog_post" ("slug")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_BLOG_POST_STATUS" ON "blog_post" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_BLOG_POST_HIGHLIGHT" ON "blog_post" ("highlight")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_BLOG_POST_PUBLISH_DATE" ON "blog_post" ("publish_date")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_BLOG_POST_PUBLISH_DATE"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_BLOG_POST_HIGHLIGHT"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_BLOG_POST_STATUS"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_BLOG_POST_SLUG"
        `);
        await queryRunner.query(`
            DROP TABLE "blog_post"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."blog_post_status_enum"
        `);
    }

}
