import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rotação do conteúdo da etiqueta, em graus.
 *
 * A direção em que a cabeça térmica imprime depende do modelo e de como o rolo
 * é carregado, e não há forma de a deduzir a partir do browser. Fica
 * configurável; `0` mantém o que se imprime hoje.
 */
export class AddLabelRotationToSystemParameter1786200000000
  implements MigrationInterface
{
  name = 'AddLabelRotationToSystemParameter1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "label_rotation_deg" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_parameter" DROP COLUMN "label_rotation_deg"`,
    );
  }
}
