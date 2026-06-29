import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tal como em blog_category, o slug do blog_post tinha unicidade sobre TODA a
 * tabela (constraint `UQ_7a1f994eda1ad6e18788ca90b9e` + índice único
 * `IDX_BLOG_POST_SLUG`). Com soft-delete, um post apagado continuava a ocupar o
 * slug, impedindo recriar um post com o mesmo slug (500). Substituímos por um
 * índice único parcial que só considera linhas vivas (`deleted_at IS NULL`).
 */
export class BlogPostSlugPartialUnique1782800000000
  implements MigrationInterface
{
  name = 'BlogPostSlugPartialUnique1782800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_post" DROP CONSTRAINT IF EXISTS "UQ_7a1f994eda1ad6e18788ca90b9e"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_BLOG_POST_SLUG"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_BLOG_POST_SLUG" ON "blog_post" ("slug") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_BLOG_POST_SLUG"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_BLOG_POST_SLUG" ON "blog_post" ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post" ADD CONSTRAINT "UQ_7a1f994eda1ad6e18788ca90b9e" UNIQUE ("slug")`,
    );
  }
}
