import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * O slug da categoria de blog tinha unicidade sobre TODA a tabela (constraint
 * `UQ_blog_category_slug` + índice único `IDX_BLOG_CATEGORY_SLUG`). Com
 * soft-delete, uma categoria apagada continuava a "ocupar" o slug, impedindo
 * recriar uma categoria com o mesmo slug (500 ao tentar). Substituímos por um
 * índice único parcial que só considera linhas vivas (`deleted_at IS NULL`).
 */
export class BlogCategorySlugPartialUnique1782600000000
  implements MigrationInterface
{
  name = 'BlogCategorySlugPartialUnique1782600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_category" DROP CONSTRAINT IF EXISTS "UQ_blog_category_slug"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_BLOG_CATEGORY_SLUG"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_BLOG_CATEGORY_SLUG" ON "blog_category" ("slug") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_BLOG_CATEGORY_SLUG"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_BLOG_CATEGORY_SLUG" ON "blog_category" ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_category" ADD CONSTRAINT "UQ_blog_category_slug" UNIQUE ("slug")`,
    );
  }
}
