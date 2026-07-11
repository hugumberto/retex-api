import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaitingToStartRouteStatus1784300000000
  implements MigrationInterface
{
  name = 'AddWaitingToStartRouteStatus1784300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Novo estado da rota: todas as solicitações confirmaram a recolha.
    // Posicionado entre CREATED e IN_TRANSIT na ordem do enum.
    await queryRunner.query(
      `ALTER TYPE "public"."route_status_enum" ADD VALUE IF NOT EXISTS 'WAITING_TO_START' BEFORE 'IN_TRANSIT'`,
    );
  }

  public async down(): Promise<void> {
    // O PostgreSQL não suporta remover valores de um enum. Reverter exigiria
    // recriar o tipo e reescrever a coluna; deixado como no-op intencional.
  }
}
