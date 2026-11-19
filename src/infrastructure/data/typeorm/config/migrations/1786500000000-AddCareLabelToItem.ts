import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCareLabelToItem1786500000000 implements MigrationInterface {
  name = 'AddCareLabelToItem1786500000000';

  // Coluna nula e sem backfill: dos itens já triados não se sabe o estado da
  // etiqueta, e preenchê-los com LEGIBLE seria inventar dados.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."item_care_label_enum" AS ENUM('LEGIBLE', 'ILLEGIBLE', 'MISSING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD "care_label" "public"."item_care_label_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "care_label"`);
    await queryRunner.query(`DROP TYPE "public"."item_care_label_enum"`);
  }
}
