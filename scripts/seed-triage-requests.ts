/**
 * Semeia pacotes prontos a triar.
 *
 * Cria N solicitações em COLLECTED, cada uma com M sacos por usar (sem peso,
 * sem itens) — o estado exato que o ecrã de Triagem espera — e imprime os
 * códigos a ler no scanner. Escreve direto na base de dados: o
 * CreateCollectionRequestUseCase exige o ciclo completo (zona de serviço,
 * confirmação por email, rota, recolha) e não deixa chegar a COLLECTED.
 *
 * Todos os pacotes pertencem a um utilizador de teste dedicado, que é o que
 * torna o `--clean` seguro: só apaga o que estiver pendurado nesse utilizador,
 * nunca dados reais.
 *
 * Uso:
 *   docker exec application yarn seed:triage
 *   docker exec -e COUNT=1 -e BAGS=2 application yarn seed:triage
 *   docker exec application yarn seed:triage --clean
 *
 *   # a partir do host, o DATABASE_URL do .env aponta para o host `postgresdb`,
 *   # que só resolve dentro do Docker:
 *   DATABASE_URL=postgres://postgres:postgres@localhost:5432/retex yarn seed:triage
 *
 * Nota: inicializar o DATA_SOURCE aplica migrações pendentes
 * (`migrationsRun: true` em typeorm.config.ts), tal como no geocode:backfill.
 */
import 'dotenv/config';
import { EntityManager } from 'typeorm';
import {
  generateBatchId,
  generateFriendlyCode,
  generateToken,
} from '../src/app/use-cases/collection-request-bag/bag.util';
import { DATA_SOURCE } from '../src/infrastructure/data/typeorm/config/datasource';

const TEST_EMAIL = 'triagem.teste@retex.local';

const COUNT = Number(process.env.COUNT ?? 3);
const BAGS = Number(process.env.BAGS ?? 4);

/** Violação de restrição UNIQUE no Postgres. */
const UNIQUE_VIOLATION = '23505';

/**
 * Repete a inserção com um código novo se houver colisão no `friendly_code` ou
 * no `token` — ambos UNIQUE. É improvável, mas o próprio
 * generate-collection-bags-use-case também repete, e rebentar a meio da
 * transação deixaria o utilizador sem perceber porquê.
 */
async function insertWithUniqueRetry<T>(
  attempt: () => Promise<T>,
  what: string,
): Promise<T> {
  for (let tries = 0; tries < 5; tries++) {
    try {
      return await attempt();
    } catch (error) {
      if ((error as { code?: string })?.code !== UNIQUE_VIOLATION) throw error;
      console.warn(`  · colisão de código em ${what}, a gerar outro`);
    }
  }
  throw new Error(`Não foi possível gerar um código único para ${what}`);
}

/** Cria o utilizador de teste na primeira execução e reutiliza-o depois. */
async function ensureTestUser(manager: EntityManager): Promise<string> {
  const [existing] = await manager.query(
    `SELECT id FROM "user" WHERE email = $1`,
    [TEST_EMAIL],
  );
  if (existing) return existing.id;

  // Este utilizador é apenas o dono dos pacotes; nunca faz login, por isso a
  // password é uma constante inutilizável (não é um hash bcrypt válido).
  const [created] = await manager.query(
    `INSERT INTO "user"
       (first_name, last_name, email, contact_phone, password, status, user_type)
     VALUES ('Triagem', 'Teste', $1, '900000000', 'SEED-NO-LOGIN', 'ACTIVE', 'PERSON')
     RETURNING id`,
    [TEST_EMAIL],
  );
  console.log(`Utilizador de teste criado: ${TEST_EMAIL}`);
  return created.id;
}

/** Idem para a morada — o ecrã mostra-a no cartão de dados do utilizador. */
async function ensureTestAddress(
  manager: EntityManager,
  userId: string,
): Promise<string> {
  const [existing] = await manager.query(
    `SELECT id FROM user_address WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
    [userId],
  );
  if (existing) return existing.id;

  const [created] = await manager.query(
    `INSERT INTO user_address
       (user_id, street, number, complement, city, city_normalized, city_division,
        country, country_division, zip_code, lat, long, is_default, is_in_service_zone)
     VALUES ($1, 'Rua de Teste da Triagem', '100', 'Piso 1', 'Maia', 'maia', 'Porto',
             'Portugal', 'Norte', '4470-000', 41.23, -8.62, true, true)
     RETURNING id`,
    [userId],
  );
  console.log('Morada de teste criada');
  return created.id;
}

async function seed(manager: EntityManager) {
  const userId = await ensureTestUser(manager);
  const addressId = await ensureTestAddress(manager, userId);
  const year = new Date().getFullYear();

  console.log(`\nA criar ${COUNT} pacote(s) com ${BAGS} saco(s) cada:\n`);

  for (let i = 0; i < COUNT; i++) {
    // `weight` fica a NULL: é o servidor que o calcula ao processar os sacos.
    // Sem `route_id` — a rota é opcional na triagem.
    const [request] = await insertWithUniqueRetry(
      () =>
        manager.query(
          `INSERT INTO collection_request
             (status, friendly_code, user_id, address_id, estimated_bags,
              bags_generated, collection_confirmed_at)
           VALUES ('COLLECTED', $1, $2, $3, $4, $4, now())
           RETURNING id, friendly_code`,
          [generateFriendlyCode(year), userId, addressId, BAGS],
        ),
      'collection_request',
    );

    // Um `batch_id` por pacote — é o que "lote" significa: uma geração.
    const batchId = generateBatchId();
    const bagCodes: string[] = [];

    for (let b = 0; b < BAGS; b++) {
      // `used_at` acompanha sempre o vínculo ao pacote (ver bind-qr-code-use-case);
      // `weight` e `processed_at` a NULL para o saco aparecer como Pendente.
      const [bag] = await insertWithUniqueRetry(
        () =>
          manager.query(
            `INSERT INTO collection_request_bag
               (token, friendly_code, batch_id, collection_request_id, used_at)
             VALUES ($1, $2, $3, $4, now())
             RETURNING friendly_code`,
            [generateToken(), generateFriendlyCode(year), batchId, request.id],
          ),
        'collection_request_bag',
      );
      bagCodes.push(bag.friendly_code);
    }

    console.log(
      `Pacote ${request.friendly_code}  ·  COLLECTED  ·  ${BAGS} sacos`,
    );
    console.log(`  ${bagCodes.map((code) => `· ${code}`).join('   ')}\n`);
  }

  console.log(
    'Pronto. Lê qualquer um destes códigos em /portal/triage (o do pacote ou o de um saco).',
  );
}

async function clean(manager: EntityManager) {
  const [user] = await manager.query(
    `SELECT id FROM "user" WHERE email = $1`,
    [TEST_EMAIL],
  );
  if (!user) {
    console.log('Não há utilizador de teste — nada a limpar.');
    return;
  }

  // Apagar fisicamente (são dados de teste) e pela ordem das chaves
  // estrangeiras. O filtro por `user_id` do utilizador de teste é o que
  // garante que nunca se toca em dados reais.
  const items = await manager.query(
    `DELETE FROM item
      WHERE collection_request_id IN (SELECT id FROM collection_request WHERE user_id = $1)`,
    [user.id],
  );
  const bags = await manager.query(
    `DELETE FROM collection_request_bag
      WHERE collection_request_id IN (SELECT id FROM collection_request WHERE user_id = $1)`,
    [user.id],
  );
  const requests = await manager.query(
    `DELETE FROM collection_request WHERE user_id = $1`,
    [user.id],
  );

  // O driver devolve [linhas, contagem] nos DELETE.
  const removed = (result: unknown) =>
    Array.isArray(result) ? (result[1] as number) ?? 0 : 0;

  console.log(
    `Removidos: ${removed(requests)} pacote(s), ${removed(bags)} saco(s), ${removed(items)} item(ns).`,
  );
  console.log('O utilizador e a morada de teste ficam, para a próxima execução.');
}

async function main() {
  const isClean = process.argv.includes('--clean');

  await DATA_SOURCE.initialize();
  try {
    await DATA_SOURCE.transaction(async (manager) => {
      if (isClean) {
        await clean(manager);
      } else {
        await seed(manager);
      }
    });
  } finally {
    await DATA_SOURCE.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
