# Scripts

Utilitários de manutenção e de apoio ao desenvolvimento. Nenhum deles é usado em
tempo de execução pela API — são todos para correr à mão.

| Script | Atalho | O que faz | Destrutivo |
|---|---|---|---|
| `seed-triage-requests.ts` | `yarn seed:triage` | Cria pacotes prontos a triar | Só com `--clean` |
| `backfill-geocoding.ts` | `yarn geocode:backfill` | Preenche coordenadas em falta nas moradas | Não |
| `db-refresh-from-prod.sh` | `yarn db:refresh` | Repõe a base local a partir de um dump da produção | **Sim** |
| `blog-post-clean.sh` | — | Testa os endpoints do blog de ponta a ponta | **Sim** |

## Onde correr cada um

Isto é a fonte da maioria dos enganos, por isso vale a pena fixar:

- **Os scripts TypeScript** (`seed:triage`, `geocode:backfill`) falam com a base de
  dados. O `DATABASE_URL` do `.env` aponta para o host `postgresdb`, que só
  resolve **dentro** do Docker — logo, correm-se dentro do contentor:

  ```bash
  docker exec application yarn seed:triage
  ```

  A partir do host tens de trocar o hostname:

  ```bash
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/retex yarn seed:triage
  ```

- **Os scripts bash** (`db:refresh`, `blog-post-clean.sh`) correm **no host**: o
  primeiro comanda o Docker, o segundo fala com a API por HTTP.

> Nota: inicializar o `DATA_SOURCE` aplica migrações pendentes
> (`migrationsRun: true` em `typeorm.config.ts`). Vale para os dois scripts
> TypeScript.

---

## `seed-triage-requests.ts` — pacotes prontos a triar

Cria solicitações em `COLLECTED`, cada uma com sacos por usar (sem peso, sem
itens) — o estado que o ecrã de Triagem espera — e imprime os códigos a ler no
scanner.

Escreve direto na base de dados: o `CreateCollectionRequestUseCase` exige o ciclo
completo (zona de serviço, confirmação por email, rota, recolha) e não permite
chegar a `COLLECTED`. Os códigos são gerados com os utilitários da própria
aplicação (`bag.util.ts`), pelo que saem no formato real.

```bash
docker exec application yarn seed:triage                        # 3 pacotes × 4 sacos
docker exec -e COUNT=1 -e BAGS=2 application yarn seed:triage   # à medida
docker exec application yarn seed:triage --clean                # apaga o que criou
```

| Variável | Omissão | Efeito |
|---|---|---|
| `COUNT` | 3 | Número de pacotes |
| `BAGS` | 4 | Sacos por pacote |

Saída:

```
Pacote 2026-TD9KU8  ·  COLLECTED  ·  4 sacos
  · 2026-K7ESYN   · 2026-PUBALC   · 2026-NKY4ST   · 2026-LQZS77
```

Qualquer um destes códigos serve no campo de consulta de `/portal/triage` — o do
pacote ou o de um saco.

**Idempotente:** os pacotes pertencem todos a um utilizador de teste dedicado,
`triagem.teste@retex.local`, criado na primeira execução e reutilizado depois.
Correr várias vezes não duplica utilizador nem morada, só acrescenta pacotes.

**O `--clean` é seguro:** apaga apenas o que está pendurado nesse utilizador de
teste, nunca dados reais. O utilizador e a morada ficam, para a execução
seguinte. O hábito útil é correr `--clean` antes de cada nova ronda de testes.

---

## `backfill-geocoding.ts` — coordenadas em falta

Percorre as moradas com `lat = 0` e `long = 0`, geocodifica via TomTom e grava as
coordenadas. Espera 250 ms entre chamadas para não abusar da API.

```bash
docker exec -e TOMTOM_API_KEY=xxxxx application yarn geocode:backfill
```

Aborta logo se `TOMTOM_API_KEY` não estiver definida. Moradas sem
correspondência ficam como estão e são listadas no fim como `sem match`.

---

## `db-refresh-from-prod.sh` — repor a base a partir de produção

**Destrói a base de dados local** e recria-a de raiz a partir de um `pg_dump` da
produção. Usa o `pg_dump`/`pg_restore` de dentro do contentor `postgresdb`, por
isso não precisas de cliente Postgres no host.

```bash
yarn db:refresh
scripts/db-refresh-from-prod.sh --help
```

| Opção | Efeito |
|---|---|
| `--skip-dump` | Reutiliza `backups/prd.dump` em vez de ir buscar à produção |
| `--skip-admin-reset` | Não repõe a password do admin a partir do `.env` |
| `-y`, `--yes` | Não pede confirmação antes de destruir a base local |
| `-h`, `--help` | Mostra a ajuda |

A connection string da produção (o *External Database URL* no dashboard do
Render) vem da variável `PROD_DATABASE_URL` ou de um ficheiro `.env.prod` na raiz
do projeto — que está no `.gitignore` e **nunca deve ser versionado**.

Faz `DROP DATABASE` + `CREATE DATABASE` em vez de `pg_restore --clean` por uma
razão concreta: quando a branch local tem migrações ainda não publicadas, sobram
objetos que não existem em produção, o `DROP TABLE` fica bloqueado por
dependências e a base acaba silenciosamente inconsistente. Durante o processo o
contentor `application` é parado (para libertar ligações) e arrancado no fim, o
que aplica as migrações pendentes.

---

## `blog-post-clean.sh` — teste de ponta a ponta do blog

Percorre os endpoints de `blog-post` contra uma API a correr: autentica-se, cria
posts, publica, testa listagens, validações e ordenação por destaque, e limpa no
fim.

```bash
scripts/blog-post-clean.sh
```

Precisa da API em `http://localhost:3000` e do `jq` instalado. As credenciais
estão fixas no topo do ficheiro (`admin@retex.pt`).

> **Atenção:** antes de criar os posts de teste, o script **apaga os posts de
> blog existentes** (até 50) na base a que a API estiver ligada. Corre-o apenas
> contra um ambiente local descartável — nunca com a API apontada a produção.
