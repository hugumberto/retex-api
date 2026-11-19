import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Novo modelo de armazenamento e triagem.
 *
 * O lote físico deixa de combinar todos os atributos da peça: passa a ser
 * identificado só pelos indicadores básicos — grupo (Homem / Mulher / Criança)
 * × estação × parte (Superior / Inferior), mais um lote único não
 * reutilizável. Os restantes atributos ficam na peça, só para relatórios.
 *
 * Dados existentes:
 * - item.quality GOOD → condition GOOD; MEDIUM → REGULAR; BAD → destino
 *   NON_REUSABLE (sem estado).
 * - Lotes: o grupo vem de sexo + faixa etária (Criança junta os dois sexos) e
 *   qualidade BAD vai para o lote não reutilizável. Os lotes ativos que caem
 *   na mesma combinação nova são fundidos: fica ativo o que tem mais itens
 *   (mantém código / QR), recebe os itens e o peso dos outros, e os outros
 *   ficam INATIVO.
 *
 * O `down` repõe a estrutura antiga, mas não desfaz a fusão dos lotes.
 */
export class NewStorageAndTriageModel1786400000000 implements MigrationInterface {
  name = 'NewStorageAndTriageModel1786400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------------------------------------------------------------- brand
    await queryRunner.query(
      `ALTER TABLE "brand" ADD "premium" boolean NOT NULL DEFAULT false`,
    );

    // ----------------------------------------------------------------- item
    await queryRunner.query(
      `CREATE TYPE "public"."item_destination_enum" AS ENUM('REUSE', 'VINTAGE', 'RECONDITIONING', 'UPCYCLING', 'STOCK_RESERVE', 'NON_REUSABLE', 'ACCESSORY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."item_condition_enum" AS ENUM('EXCELLENT', 'GOOD', 'REGULAR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."item_category_enum" AS ENUM('TOP', 'SWEATER', 'COAT', 'DRESS', 'SUIT_JACKET', 'PAJAMA_TOP', 'SPORTSWEAR_TOP', 'BRA', 'UNDERSHIRT', 'SWIM_TOP', 'SWIMSUIT', 'TROUSERS', 'SHORTS', 'SKIRT', 'JUMPSUIT', 'SUIT_TROUSERS', 'PAJAMA_BOTTOM', 'SPORTSWEAR_BOTTOM', 'UNDERPANTS', 'SWIM_BOTTOM')`,
    );

    await queryRunner.query(
      `ALTER TABLE "item" ADD "destination" "public"."item_destination_enum" NOT NULL DEFAULT 'REUSE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD "condition" "public"."item_condition_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD "category" "public"."item_category_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "item" ADD "denim" boolean`);
    await queryRunner.query(
      `ALTER TABLE "item" ADD "material" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD "color" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD "size" character varying(20)`,
    );
    await queryRunner.query(`ALTER TABLE "item" ADD "operator_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_ITEM_OPERATOR" FOREIGN KEY ("operator_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      UPDATE "item" SET
        "condition" = CASE "quality"
          WHEN 'GOOD' THEN 'GOOD'::"public"."item_condition_enum"
          WHEN 'MEDIUM' THEN 'REGULAR'::"public"."item_condition_enum"
        END,
        "destination" = CASE "quality"
          WHEN 'BAD' THEN 'NON_REUSABLE'::"public"."item_destination_enum"
          ELSE 'REUSE'::"public"."item_destination_enum"
        END
    `);

    // Indicadores básicos só são obrigatórios para destinos reutilizáveis.
    await queryRunner.query(`ALTER TABLE "item" ALTER COLUMN "sex" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "item" ALTER COLUMN "age_group" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "item" ALTER COLUMN "season" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "item" ALTER COLUMN "type" DROP NOT NULL`);

    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "quality"`);
    await queryRunner.query(`DROP TYPE "public"."item_quality_enum"`);

    // --------------------------------------------------------- storage_unit
    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_group_enum" AS ENUM('MEN', 'WOMEN', 'CHILDREN', 'NON_REUSABLE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "storage_group" "public"."storage_unit_group_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "location" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "storage_unit" ALTER COLUMN "season" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "storage_unit" ALTER COLUMN "type" DROP NOT NULL`);

    await queryRunner.query(`
      UPDATE "storage_unit" SET "storage_group" = CASE
        WHEN "quality" = 'BAD' THEN 'NON_REUSABLE'::"public"."storage_unit_group_enum"
        WHEN "age_group" = 'CHILD' THEN 'CHILDREN'::"public"."storage_unit_group_enum"
        WHEN "sex" = 'MALE' THEN 'MEN'::"public"."storage_unit_group_enum"
        ELSE 'WOMEN'::"public"."storage_unit_group_enum"
      END
    `);
    await queryRunner.query(`
      UPDATE "storage_unit" SET "season" = NULL, "type" = NULL
      WHERE "storage_group" = 'NON_REUSABLE'
    `);

    // Fusão dos lotes ativos por combinação nova. O que fica é o que tem mais
    // itens (empate: o mais antigo).
    await queryRunner.query(`
      CREATE TEMP TABLE "storage_unit_merge" AS
      WITH ranked AS (
        SELECT
          su."id",
          FIRST_VALUE(su."id") OVER (
            PARTITION BY su."storage_group", su."season", su."type"
            ORDER BY
              (SELECT COUNT(*) FROM "item" i
                 WHERE i."storage_unit_id" = su."id" AND i."deleted_at" IS NULL) DESC,
              su."created_at" ASC,
              su."id" ASC
          ) AS "keeper_id"
        FROM "storage_unit" su
        WHERE su."status" = 'ATIVO' AND su."deleted_at" IS NULL
      )
      SELECT "id", "keeper_id" FROM ranked WHERE "id" <> "keeper_id"
    `);

    await queryRunner.query(`
      UPDATE "item" i SET "storage_unit_id" = m."keeper_id"
      FROM "storage_unit_merge" m
      WHERE i."storage_unit_id" = m."id"
    `);
    await queryRunner.query(`
      UPDATE "storage_unit" k SET "weight" = k."weight" + s."weight"
      FROM (
        SELECT m."keeper_id", SUM(su."weight") AS "weight"
        FROM "storage_unit_merge" m
        JOIN "storage_unit" su ON su."id" = m."id"
        GROUP BY m."keeper_id"
      ) s
      WHERE k."id" = s."keeper_id"
    `);
    await queryRunner.query(`
      UPDATE "storage_unit" su SET "status" = 'INATIVO', "weight" = 0
      FROM "storage_unit_merge" m
      WHERE su."id" = m."id"
    `);

    await queryRunner.query(`DROP TABLE "storage_unit_merge"`);

    // Recalcula o contador denormalizado em todos os lotes.
    await queryRunner.query(`
      UPDATE "storage_unit" su SET "items_count" = (
        SELECT COUNT(*) FROM "item" i
        WHERE i."storage_unit_id" = su."id" AND i."deleted_at" IS NULL
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "storage_unit" ALTER COLUMN "storage_group" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD CONSTRAINT "CHK_STORAGE_UNIT_SLOT" CHECK (("storage_group" = 'NON_REUSABLE' AND "season" IS NULL AND "type" IS NULL) OR ("storage_group" <> 'NON_REUSABLE' AND "season" IS NOT NULL AND "type" IS NOT NULL))`,
    );

    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "quality"`);
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "sex"`);
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "age_group"`);
    await queryRunner.query(`DROP TYPE "public"."storage_unit_quality_enum"`);
    await queryRunner.query(`DROP TYPE "public"."storage_unit_sex_enum"`);
    await queryRunner.query(`DROP TYPE "public"."storage_unit_age_group_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // --------------------------------------------------------- storage_unit
    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_quality_enum" AS ENUM('GOOD', 'MEDIUM', 'BAD')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_sex_enum" AS ENUM('MALE', 'FEMALE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_age_group_enum" AS ENUM('ADULT', 'CHILD')`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" DROP CONSTRAINT "CHK_STORAGE_UNIT_SLOT"`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "quality" "public"."storage_unit_quality_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "sex" "public"."storage_unit_sex_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD "age_group" "public"."storage_unit_age_group_enum"`,
    );
    await queryRunner.query(`
      UPDATE "storage_unit" SET
        "quality" = CASE WHEN "storage_group" = 'NON_REUSABLE' THEN 'BAD' ELSE 'GOOD' END::"public"."storage_unit_quality_enum",
        "sex" = CASE WHEN "storage_group" = 'WOMEN' THEN 'FEMALE' ELSE 'MALE' END::"public"."storage_unit_sex_enum",
        "age_group" = CASE WHEN "storage_group" = 'CHILDREN' THEN 'CHILD' ELSE 'ADULT' END::"public"."storage_unit_age_group_enum",
        "season" = COALESCE("season", 'SUMMER'),
        "type" = COALESCE("type", 'UPPER_PART')
    `);
    await queryRunner.query(`ALTER TABLE "storage_unit" ALTER COLUMN "quality" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "storage_unit" ALTER COLUMN "sex" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "storage_unit" ALTER COLUMN "age_group" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "storage_unit" ALTER COLUMN "season" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "storage_unit" ALTER COLUMN "type" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "location"`);
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "storage_group"`);
    await queryRunner.query(`DROP TYPE "public"."storage_unit_group_enum"`);

    // ----------------------------------------------------------------- item
    await queryRunner.query(
      `CREATE TYPE "public"."item_quality_enum" AS ENUM('GOOD', 'MEDIUM', 'BAD')`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD "quality" "public"."item_quality_enum"`,
    );
    await queryRunner.query(`
      UPDATE "item" SET "quality" = CASE
        WHEN "destination" IN ('NON_REUSABLE', 'ACCESSORY') THEN 'BAD'
        WHEN "condition" = 'REGULAR' THEN 'MEDIUM'
        ELSE 'GOOD'
      END::"public"."item_quality_enum"
    `);
    await queryRunner.query(`
      UPDATE "item" SET
        "sex" = COALESCE("sex", 'MALE'),
        "age_group" = COALESCE("age_group", 'ADULT'),
        "season" = COALESCE("season", 'SUMMER'),
        "type" = COALESCE("type", 'UPPER_PART')
    `);
    await queryRunner.query(`ALTER TABLE "item" ALTER COLUMN "quality" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "item" ALTER COLUMN "sex" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "item" ALTER COLUMN "age_group" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "item" ALTER COLUMN "season" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "item" ALTER COLUMN "type" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_ITEM_OPERATOR"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "operator_id"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "size"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "color"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "material"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "denim"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "category"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "condition"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "destination"`);
    await queryRunner.query(`DROP TYPE "public"."item_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."item_condition_enum"`);
    await queryRunner.query(`DROP TYPE "public"."item_destination_enum"`);

    // ---------------------------------------------------------------- brand
    await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "premium"`);
  }
}
