import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShiftToRoute1756000000000 implements MigrationInterface {
  name = 'AddShiftToRoute1756000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "route"
            ADD "shift" character varying NOT NULL DEFAULT 'PADRÃO'
        `);

    // Remove o valor padrão após adicionar a coluna
    await queryRunner.query(`
            ALTER TABLE "route"
            ALTER COLUMN "shift" DROP DEFAULT
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "route" DROP COLUMN "shift"
        `);
  }
}
