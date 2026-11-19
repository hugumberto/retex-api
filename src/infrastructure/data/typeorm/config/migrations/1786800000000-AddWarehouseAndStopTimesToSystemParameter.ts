import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWarehouseAndStopTimesToSystemParameter1786800000000
  implements MigrationInterface
{
  name = 'AddWarehouseAndStopTimesToSystemParameter1786800000000';

  // Morada e coordenadas do armazém ficam nulas até alguém as definir em
  // Parâmetros. Tempos por paragem: 5 min fixos + 1 min por saco.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "warehouse_address" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "warehouse_lat" numeric(10,7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "warehouse_long" numeric(10,7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "stop_base_minutes" integer NOT NULL DEFAULT 5`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "stop_minutes_per_bag" integer NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "system_parameter" DROP COLUMN "stop_minutes_per_bag"`);
    await queryRunner.query(`ALTER TABLE "system_parameter" DROP COLUMN "stop_base_minutes"`);
    await queryRunner.query(`ALTER TABLE "system_parameter" DROP COLUMN "warehouse_long"`);
    await queryRunner.query(`ALTER TABLE "system_parameter" DROP COLUMN "warehouse_lat"`);
    await queryRunner.query(`ALTER TABLE "system_parameter" DROP COLUMN "warehouse_address"`);
  }
}
