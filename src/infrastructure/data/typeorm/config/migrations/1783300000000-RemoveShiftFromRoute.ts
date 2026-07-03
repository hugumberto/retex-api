import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveShiftFromRoute1783300000000 implements MigrationInterface {
  name = 'RemoveShiftFromRoute1783300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "route" DROP COLUMN "shift"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recria a coluna com default temporário para preencher linhas existentes,
    // depois remove o default (estado original: NOT NULL sem default).
    await queryRunner.query(
      `ALTER TABLE "route" ADD "shift" character varying NOT NULL DEFAULT 'PADRÃO'`,
    );
    await queryRunner.query(
      `ALTER TABLE "route" ALTER COLUMN "shift" DROP DEFAULT`,
    );
  }
}
