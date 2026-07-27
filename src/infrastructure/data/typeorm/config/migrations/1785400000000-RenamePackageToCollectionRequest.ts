import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renomeia o conceito `package` (pedido individual de recolha do cliente) para
 * `collection_request`, alinhando a BD com a nomenclatura canónica usada na API
 * e na UI ("Solicitação de recolha"). Renomeia a tabela, o tipo enum de estado,
 * as colunas FK em `item`/`qr_code` e as constraints/índices associados.
 *
 * Cada passo é idempotente (só renomeia se o objeto de origem ainda existir e o
 * de destino ainda não existir), para ser seguro em ambientes onde parte do
 * rename já tenha sido aplicada.
 *
 * NOTA: o template/tipo de email `package-confirmation` é deliberadamente
 * mantido (string persistida em `email_log`).
 */
export class RenamePackageToCollectionRequest1785400000000
  implements MigrationInterface
{
  name = 'RenamePackageToCollectionRequest1785400000000';

  // Renomeia uma tabela apenas se a origem existir e o destino não.
  private async renameTable(qr: QueryRunner, from: string, to: string) {
    await qr.query(`
      DO $$
      BEGIN
        IF to_regclass('public.${from}') IS NOT NULL
           AND to_regclass('public.${to}') IS NULL THEN
          ALTER TABLE "${from}" RENAME TO "${to}";
        END IF;
      END $$;
    `);
  }

  // Renomeia um tipo enum apenas se a origem existir e o destino não.
  private async renameType(qr: QueryRunner, from: string, to: string) {
    await qr.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${from}')
           AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${to}') THEN
          ALTER TYPE "public"."${from}" RENAME TO "${to}";
        END IF;
      END $$;
    `);
  }

  // Renomeia uma coluna apenas se a origem existir e o destino não.
  private async renameColumn(
    qr: QueryRunner,
    table: string,
    from: string,
    to: string,
  ) {
    await qr.query(`
      DO $$
      BEGIN
        IF EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = '${table}' AND column_name = '${from}'
           )
           AND NOT EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = '${table}' AND column_name = '${to}'
           ) THEN
          ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}";
        END IF;
      END $$;
    `);
  }

  // Renomeia uma constraint apenas se a origem existir e o destino não.
  private async renameConstraint(
    qr: QueryRunner,
    table: string,
    from: string,
    to: string,
  ) {
    await qr.query(`
      DO $$
      BEGIN
        IF EXISTS (
             SELECT 1 FROM pg_constraint WHERE conname = '${from}'
           )
           AND NOT EXISTS (
             SELECT 1 FROM pg_constraint WHERE conname = '${to}'
           ) THEN
          ALTER TABLE "${table}" RENAME CONSTRAINT "${from}" TO "${to}";
        END IF;
      END $$;
    `);
  }

  // Renomeia um índice apenas se a origem existir e o destino não.
  private async renameIndex(qr: QueryRunner, from: string, to: string) {
    await qr.query(`
      DO $$
      BEGIN
        IF to_regclass('public.${from}') IS NOT NULL
           AND to_regclass('public.${to}') IS NULL THEN
          ALTER INDEX "${from}" RENAME TO "${to}";
        END IF;
      END $$;
    `);
  }

  public async up(qr: QueryRunner): Promise<void> {
    // Tabela + tipo enum
    await this.renameTable(qr, 'package', 'collection_request');
    await this.renameType(
      qr,
      'package_status_enum',
      'collection_request_status_enum',
    );

    // Colunas FK que apontam para a tabela renomeada
    await this.renameColumn(qr, 'item', 'package_id', 'collection_request_id');
    await this.renameColumn(
      qr,
      'qr_code',
      'package_id',
      'collection_request_id',
    );

    // PK
    await this.renameConstraint(
      qr,
      'collection_request',
      'PK_308364c66df656295bc4ec467c2',
      'PK_collection_request',
    );

    // FKs próprias de collection_request
    await this.renameConstraint(
      qr,
      'collection_request',
      'FK_04a9cd5f7a04bd02cfc9c7e6450',
      'FK_COLLECTION_REQUEST_USER',
    );
    await this.renameConstraint(
      qr,
      'collection_request',
      'FK_6194c900d7f2a8179ce3776f86d',
      'FK_COLLECTION_REQUEST_ROUTE',
    );
    await this.renameConstraint(
      qr,
      'collection_request',
      'FK_PACKAGE_ADDRESS',
      'FK_COLLECTION_REQUEST_ADDRESS',
    );

    // FKs que referenciam collection_request a partir de outras tabelas
    await this.renameConstraint(
      qr,
      'item',
      'FK_a9468cba496c666c284ea222c13',
      'FK_ITEM_COLLECTION_REQUEST',
    );
    await this.renameConstraint(
      qr,
      'qr_code',
      'FK_qr_code_package',
      'FK_qr_code_collection_request',
    );

    // Índices únicos
    await this.renameIndex(
      qr,
      'UQ_PACKAGE_COLLECTION_CONFIRMATION_TOKEN',
      'UQ_COLLECTION_REQUEST_COLLECTION_CONFIRMATION_TOKEN',
    );
    await this.renameIndex(
      qr,
      'UQ_PACKAGE_FRIENDLY_CODE',
      'UQ_COLLECTION_REQUEST_FRIENDLY_CODE',
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    // Índices únicos
    await this.renameIndex(
      qr,
      'UQ_COLLECTION_REQUEST_FRIENDLY_CODE',
      'UQ_PACKAGE_FRIENDLY_CODE',
    );
    await this.renameIndex(
      qr,
      'UQ_COLLECTION_REQUEST_COLLECTION_CONFIRMATION_TOKEN',
      'UQ_PACKAGE_COLLECTION_CONFIRMATION_TOKEN',
    );

    // FKs que referenciam collection_request a partir de outras tabelas
    await this.renameConstraint(
      qr,
      'qr_code',
      'FK_qr_code_collection_request',
      'FK_qr_code_package',
    );
    await this.renameConstraint(
      qr,
      'item',
      'FK_ITEM_COLLECTION_REQUEST',
      'FK_a9468cba496c666c284ea222c13',
    );

    // FKs próprias de collection_request
    await this.renameConstraint(
      qr,
      'collection_request',
      'FK_COLLECTION_REQUEST_ADDRESS',
      'FK_PACKAGE_ADDRESS',
    );
    await this.renameConstraint(
      qr,
      'collection_request',
      'FK_COLLECTION_REQUEST_ROUTE',
      'FK_6194c900d7f2a8179ce3776f86d',
    );
    await this.renameConstraint(
      qr,
      'collection_request',
      'FK_COLLECTION_REQUEST_USER',
      'FK_04a9cd5f7a04bd02cfc9c7e6450',
    );

    // PK
    await this.renameConstraint(
      qr,
      'collection_request',
      'PK_collection_request',
      'PK_308364c66df656295bc4ec467c2',
    );

    // Colunas FK
    await this.renameColumn(
      qr,
      'qr_code',
      'collection_request_id',
      'package_id',
    );
    await this.renameColumn(qr, 'item', 'collection_request_id', 'package_id');

    // Tabela + tipo enum
    await this.renameType(
      qr,
      'collection_request_status_enum',
      'package_status_enum',
    );
    await this.renameTable(qr, 'collection_request', 'package');
  }
}
