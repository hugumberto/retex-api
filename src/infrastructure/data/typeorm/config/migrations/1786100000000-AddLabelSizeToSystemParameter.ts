import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tamanho da etiqueta de saco passa a parâmetro de sistema.
 *
 * Os valores por omissão são os do rolo em uso (50x30mm, QR de 24mm) — os
 * mesmos que estavam fixos no CSS de impressão do portal, para que a migração
 * não altere o que já se imprime.
 */
export class AddLabelSizeToSystemParameter1786100000000
  implements MigrationInterface
{
  name = 'AddLabelSizeToSystemParameter1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "label_width_mm" integer NOT NULL DEFAULT 50`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "label_height_mm" integer NOT NULL DEFAULT 30`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "label_qr_size_mm" integer NOT NULL DEFAULT 24`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_parameter" DROP COLUMN "label_qr_size_mm"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_parameter" DROP COLUMN "label_height_mm"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_parameter" DROP COLUMN "label_width_mm"`,
    );
  }
}
