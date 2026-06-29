import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGenderAndDOBToUser1781797031481 implements MigrationInterface {
  name = 'AddGenderAndDOBToUser1781797031481';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "gender_enum" AS ENUM ('MALE', 'FEMALE', 'PREFER_NOT_TO_SAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "gender" "gender_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "date_of_birth" date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "date_of_birth"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "gender"`);
    await queryRunner.query(`DROP TYPE "gender_enum"`);
  }
}
