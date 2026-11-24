import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backoffice de blog e FAQ:
 * - artigos com resumo, texto alternativo da imagem e estado "agendado";
 * - categorias do blog com descrição e ordem no site;
 * - grupos e perguntas do FAQ com ordem, e perguntas que se podem esconder.
 * A ordem inicial é a que o site já mostrava.
 */
export class BlogAndFaqBackoffice1787200000000 implements MigrationInterface {
  name = 'BlogAndFaqBackoffice1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."blog_post_status_enum" ADD VALUE IF NOT EXISTS 'SCHEDULED'`);
    await queryRunner.query(`ALTER TABLE "blog_post" ADD "summary" character varying(160)`);
    await queryRunner.query(`ALTER TABLE "blog_post" ADD "hero_alt" character varying(255)`);

    await queryRunner.query(`ALTER TABLE "blog_category" ADD "description" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "blog_category" ADD "position" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`
      UPDATE "blog_category" c SET "position" = o.rn - 1
        FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY title) AS rn FROM "blog_category") o
       WHERE o.id = c.id`);

    await queryRunner.query(`ALTER TABLE "faq_category" ADD "position" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`
      UPDATE "faq_category" c SET "position" = o.rn - 1
        FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn FROM "faq_category") o
       WHERE o.id = c.id`);

    await queryRunner.query(`ALTER TABLE "faq_item" ADD "visible" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "faq_item" ADD "position" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`
      UPDATE "faq_item" i SET "position" = o.rn - 1
        FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) AS rn FROM "faq_item") o
       WHERE o.id = i.id`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "faq_item" DROP COLUMN "position"`);
    await queryRunner.query(`ALTER TABLE "faq_item" DROP COLUMN "visible"`);
    await queryRunner.query(`ALTER TABLE "faq_category" DROP COLUMN "position"`);
    await queryRunner.query(`ALTER TABLE "blog_category" DROP COLUMN "position"`);
    await queryRunner.query(`ALTER TABLE "blog_category" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "blog_post" DROP COLUMN "hero_alt"`);
    await queryRunner.query(`ALTER TABLE "blog_post" DROP COLUMN "summary"`);
    // Os artigos agendados voltam a rascunho; o valor do enum fica (o Postgres não o remove).
    await queryRunner.query(`UPDATE "blog_post" SET "status" = 'DRAFT' WHERE "status" = 'SCHEDULED'`);
  }
}
