import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfirmedPackageStatus1784400000000
  implements MigrationInterface
{
  name = 'AddConfirmedPackageStatus1784400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Novo estado da solicitação: cliente confirmou a recolha pelo email.
    await queryRunner.query(
      `ALTER TYPE "public"."package_status_enum" ADD VALUE IF NOT EXISTS 'CONFIRMED' AFTER 'CREATED'`,
    );
  }

  public async down(): Promise<void> {
    // O PostgreSQL não suporta remover valores de um enum. Reverter exigiria
    // recriar o tipo e reescrever a coluna; deixado como no-op intencional.
  }
}
