import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ecrã "Receção e armazém":
 * - receção dos sacos à chegada (hora e peso bruto);
 * - zona de cada lote (nula = a do grupo) e a saída que o leva;
 * - capacidade das 4 zonas em Parâmetros;
 * - saídas programadas.
 */
export class AddWarehouseReceptionZonesAndOutbound1786900000000 implements MigrationInterface {
  name = 'AddWarehouseReceptionZonesAndOutbound1786900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collection_request_bag" ADD "received_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "collection_request_bag" ADD "received_weight" numeric(10,2)`);
    await queryRunner.query(
      `CREATE INDEX "IDX_collection_request_bag_received_at" ON "collection_request_bag" ("received_at")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."warehouse_outbound_type_enum" AS ENUM('RECYCLING', 'DONATION', 'UPCYCLING', 'SALE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."warehouse_outbound_status_enum" AS ENUM('SCHEDULED', 'DONE', 'CANCELLED')`,
    );
    await queryRunner.query(`CREATE TABLE "warehouse_outbound" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "type" "public"."warehouse_outbound_type_enum" NOT NULL,
      "destination" character varying(150) NOT NULL,
      "scheduled_date" date NOT NULL,
      "weight" numeric(10,2),
      "pieces" integer,
      "notes" character varying(500),
      "status" "public"."warehouse_outbound_status_enum" NOT NULL DEFAULT 'SCHEDULED',
      "done_at" TIMESTAMP WITH TIME ZONE,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "deleted_at" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_warehouse_outbound_id" PRIMARY KEY ("id"))`);

    await queryRunner.query(
      `CREATE TYPE "public"."storage_unit_zone_enum" AS ENUM('REUSE', 'UPCYCLING', 'RECYCLING')`,
    );
    await queryRunner.query(`ALTER TABLE "storage_unit" ADD "zone" "public"."storage_unit_zone_enum"`);
    await queryRunner.query(`ALTER TABLE "storage_unit" ADD "outbound_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "storage_unit" ADD CONSTRAINT "FK_storage_unit_outbound" FOREIGN KEY ("outbound_id") REFERENCES "warehouse_outbound"("id") ON DELETE SET NULL`,
    );

    for (const [column, kg] of [
      ['zone_sorting_capacity_kg', 3000],
      ['zone_reuse_capacity_kg', 1500],
      ['zone_upcycling_capacity_kg', 500],
      ['zone_recycling_capacity_kg', 2000],
    ] as const) {
      await queryRunner.query(`ALTER TABLE "system_parameter" ADD "${column}" integer NOT NULL DEFAULT ${kg}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of [
      'zone_recycling_capacity_kg',
      'zone_upcycling_capacity_kg',
      'zone_reuse_capacity_kg',
      'zone_sorting_capacity_kg',
    ]) {
      await queryRunner.query(`ALTER TABLE "system_parameter" DROP COLUMN "${column}"`);
    }
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP CONSTRAINT "FK_storage_unit_outbound"`);
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "outbound_id"`);
    await queryRunner.query(`ALTER TABLE "storage_unit" DROP COLUMN "zone"`);
    await queryRunner.query(`DROP TYPE "public"."storage_unit_zone_enum"`);
    await queryRunner.query(`DROP TABLE "warehouse_outbound"`);
    await queryRunner.query(`DROP TYPE "public"."warehouse_outbound_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."warehouse_outbound_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_collection_request_bag_received_at"`);
    await queryRunner.query(`ALTER TABLE "collection_request_bag" DROP COLUMN "received_weight"`);
    await queryRunner.query(`ALTER TABLE "collection_request_bag" DROP COLUMN "received_at"`);
  }
}
