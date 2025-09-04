import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShiftToRoute1756000000000 implements MigrationInterface {
  name = 'AddShiftToRoute1756000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "route"
            ADD "shift" character varying NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "route" DROP COLUMN "shift"
        `);
  }
}
