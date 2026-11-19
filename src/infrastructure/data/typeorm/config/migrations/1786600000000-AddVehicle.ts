import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehicle1786600000000 implements MigrationInterface {
  name = 'AddVehicle1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicle" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plate" character varying(20) NOT NULL,
        "name" character varying(100) NOT NULL,
        "capacity_bags" integer NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_vehicle_plate" UNIQUE ("plate"),
        CONSTRAINT "PK_vehicle" PRIMARY KEY ("id")
      )`,
    );
    // Opcional: as rotas existentes não têm veículo. Apagar um veículo não
    // apaga rotas — só lhes tira a referência.
    await queryRunner.query(`ALTER TABLE "route" ADD "vehicle_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "route" ADD CONSTRAINT "FK_route_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "route" DROP CONSTRAINT "FK_route_vehicle"`);
    await queryRunner.query(`ALTER TABLE "route" DROP COLUMN "vehicle_id"`);
    await queryRunner.query(`DROP TABLE "vehicle"`);
  }
}
