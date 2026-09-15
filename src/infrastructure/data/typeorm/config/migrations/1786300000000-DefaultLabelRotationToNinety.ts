import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Passa o valor por omissão da rotação para 90 graus.
 *
 * Nas impressoras em uso a cabeça térmica imprime ao alto, e sem rodar o
 * conteúdo a etiqueta saía deitada. Muda só o default da coluna — as linhas já
 * existentes ficam com o que tiverem, para não desfazer uma escolha feita no
 * ecrã de parâmetros.
 *
 * Migração própria, em vez de editar a que criou a coluna: essa pode já ter
 * corrido, e uma migração aplicada não volta a correr.
 */
export class DefaultLabelRotationToNinety1786300000000
  implements MigrationInterface
{
  name = 'DefaultLabelRotationToNinety1786300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ALTER COLUMN "label_rotation_deg" SET DEFAULT 90`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ALTER COLUMN "label_rotation_deg" SET DEFAULT 0`,
    );
  }
}
