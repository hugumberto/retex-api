import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Supervisão da triagem: cada posto diz à API quem lá está e que pedido tem
 * aberto (triage_station), as ocorrências dos postos ficam em triage_event,
 * cada peça guarda o posto onde foi registada e há uma meta de peças por hora.
 */
export class AddTriageStations1787100000000 implements MigrationInterface {
  name = 'AddTriageStations1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."triage_station_status_enum" AS ENUM('FREE', 'SORTING', 'PAUSED')`,
    );
    await queryRunner.query(`CREATE TABLE "triage_station" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "number" integer NOT NULL,
      "operator_id" uuid,
      "collection_request_id" uuid,
      "assigned_request_id" uuid,
      "status" "public"."triage_station_status_enum" NOT NULL DEFAULT 'FREE',
      "session_started_at" TIMESTAMP WITH TIME ZONE,
      "last_seen_at" TIMESTAMP WITH TIME ZONE,
      "pending_lots" jsonb,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "deleted_at" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "UQ_triage_station_number" UNIQUE ("number"),
      CONSTRAINT "PK_triage_station" PRIMARY KEY ("id"),
      CONSTRAINT "FK_triage_station_operator" FOREIGN KEY ("operator_id") REFERENCES "user"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_triage_station_request" FOREIGN KEY ("collection_request_id") REFERENCES "collection_request"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_triage_station_assigned" FOREIGN KEY ("assigned_request_id") REFERENCES "collection_request"("id") ON DELETE SET NULL
    )`);

    await queryRunner.query(`CREATE TYPE "public"."triage_event_type_enum" AS ENUM('WRONG_BAG')`);
    await queryRunner.query(`CREATE TABLE "triage_event" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "station" integer NOT NULL,
      "type" "public"."triage_event_type_enum" NOT NULL,
      "operator_id" uuid,
      "code" character varying(100) NOT NULL,
      "request_code" character varying(50),
      "other_request_code" character varying(50),
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "deleted_at" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_triage_event" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_triage_event_created_at" ON "triage_event" ("created_at")`);

    await queryRunner.query(`ALTER TABLE "item" ADD "station" integer`);
    await queryRunner.query(`CREATE INDEX "IDX_item_created_at" ON "item" ("created_at")`);
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "triage_target_per_hour" integer NOT NULL DEFAULT 40`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "system_parameter" DROP COLUMN "triage_target_per_hour"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_item_created_at"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "station"`);
    await queryRunner.query(`DROP TABLE "triage_event"`);
    await queryRunner.query(`DROP TYPE "public"."triage_event_type_enum"`);
    await queryRunner.query(`DROP TABLE "triage_station"`);
    await queryRunner.query(`DROP TYPE "public"."triage_station_status_enum"`);
  }
}
