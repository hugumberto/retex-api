#!/usr/bin/env bash
#
# Refresca a base de dados local a partir de um dump da produção (Render).
#
# Usa o pg_dump/pg_restore que já existem dentro do container `postgresdb`,
# por isso não é preciso ter cliente Postgres instalado no host.
#
# A base local é DESTRUÍDA e recriada de raiz (DROP DATABASE + CREATE DATABASE).
# Não se usa `pg_restore --clean`: quando o branch local tem migrations que ainda
# não foram deployadas, sobram objetos que não existem em prod (ex.: uma FK de
# `company_member` para `user`), o DROP TABLE é bloqueado por dependências, o COPY
# aborta com duplicate key e as FKs ficam por criar — a base fica silenciosamente
# inconsistente. O DROP DATABASE evita isso por completo.
#
# Uso:
#   scripts/db-refresh-from-prod.sh [opções]
#
# Opções:
#   --skip-dump          Reutiliza backups/prd.dump em vez de ir buscar à prod
#   --skip-admin-reset   Não repõe a password do admin a partir do .env
#   -y, --yes            Não pede confirmação antes de destruir a base local
#   -h, --help           Mostra esta ajuda
#
# A connection string da prod (External Database URL no dashboard do Render) vem de:
#   1. variável de ambiente PROD_DATABASE_URL, ou
#   2. ficheiro .env.prod na raiz do projeto, com a linha:
#        PROD_DATABASE_URL=postgresql://user:pass@host.oregon-postgres.render.com/retex_db_b4oq
#   (.env.prod está no .gitignore — nunca versionar)

set -euo pipefail

readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly DUMP_FILE="$PROJECT_ROOT/backups/prd.dump"
readonly DB_CONTAINER="postgresdb"
readonly APP_CONTAINER="application"
readonly LOCAL_DB="${LOCAL_DB:-retex}"
readonly HEALTH_TIMEOUT=120

SKIP_DUMP=false
SKIP_ADMIN_RESET=false
ASSUME_YES=false

# ── output ────────────────────────────────────────────────────────────────────

info()  { printf '\033[0;34m▸\033[0m %s\n' "$*"; }
ok()    { printf '\033[0;32m✓\033[0m %s\n' "$*"; }
warn()  { printf '\033[0;33m!\033[0m %s\n' "$*" >&2; }
die()   { printf '\033[0;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

# Imprime o cabeçalho do próprio ficheiro, até à primeira linha que não é comentário.
usage() { awk 'NR>2 && /^#/ { sub(/^# ?/, ""); print; next } NR>2 { exit }' "${BASH_SOURCE[0]}"; }

# ── argumentos ────────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-dump)        SKIP_DUMP=true ;;
    --skip-admin-reset) SKIP_ADMIN_RESET=true ;;
    -y|--yes)           ASSUME_YES=true ;;
    -h|--help)          usage; exit 0 ;;
    *)                  die "Opção desconhecida: $1 (usa --help)" ;;
  esac
  shift
done

# Lê uma chave de um ficheiro .env sem fazer source (evita executar conteúdo).
read_env() {
  local file="$1" key="$2"
  [[ -f "$file" ]] || return 1
  local line
  line="$(grep -m1 "^${key}=" "$file" || true)"
  [[ -n "$line" ]] || return 1
  printf '%s' "${line#*=}"
}

# ── preflight ─────────────────────────────────────────────────────────────────

docker info >/dev/null 2>&1 || die "Docker não está a correr."

for c in "$DB_CONTAINER" "$APP_CONTAINER"; do
  docker inspect "$c" >/dev/null 2>&1 || die "Container '$c' não existe. Corre 'docker compose up -d' primeiro."
done

if [[ "$(docker inspect -f '{{.State.Running}}' "$DB_CONTAINER")" != "true" ]]; then
  info "A arrancar o container ${DB_CONTAINER}…"
  docker start "$DB_CONTAINER" >/dev/null
  sleep 3
fi

if [[ "$SKIP_DUMP" == false ]]; then
  PROD_URL="${PROD_DATABASE_URL:-$(read_env "$PROJECT_ROOT/.env.prod" PROD_DATABASE_URL || true)}"
  [[ -n "${PROD_URL:-}" ]] || die "PROD_DATABASE_URL não definida. Exporta-a ou cria .env.prod (vê --help)."
  # O Render exige TLS.
  [[ "$PROD_URL" == *"sslmode="* ]] || PROD_URL+="?sslmode=require"
elif [[ ! -s "$DUMP_FILE" ]]; then
  die "--skip-dump pedido mas $DUMP_FILE não existe ou está vazio."
fi

if [[ "$ASSUME_YES" == false ]]; then
  printf '\033[0;33m!\033[0m Isto APAGA a base local "%s" e substitui-a por dados de PRODUÇÃO.\n' "$LOCAL_DB"
  read -r -p "  Continuar? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || die "Abortado."
fi

# ── 1. dump da prod ───────────────────────────────────────────────────────────

if [[ "$SKIP_DUMP" == false ]]; then
  mkdir -p "$PROJECT_ROOT/backups"

  if [[ -s "$DUMP_FILE" ]]; then
    backup="$DUMP_FILE.bak-$(date +%s)"
    cp "$DUMP_FILE" "$backup"
    info "Dump anterior guardado em $(basename "$backup")"
  fi

  info "A fazer dump da produção…"
  # A URL vai por variável de ambiente para não aparecer na lista de processos.
  if ! docker exec -e PROD_URL="$PROD_URL" "$DB_CONTAINER" \
        sh -c 'pg_dump -Fc --no-owner --no-privileges "$PROD_URL"' > "$DUMP_FILE"; then
    die "pg_dump falhou. Confirma a PROD_DATABASE_URL (e que a password não foi rodada)."
  fi

  [[ -s "$DUMP_FILE" ]] || die "O dump ficou vazio."
  docker exec -i "$DB_CONTAINER" pg_restore -l >/dev/null 2>&1 < "$DUMP_FILE" \
    || die "O ficheiro gerado não é um dump válido."

  ok "Dump criado ($(du -h "$DUMP_FILE" | cut -f1)) em backups/$(basename "$DUMP_FILE")"
else
  info "A reutilizar o dump existente ($(du -h "$DUMP_FILE" | cut -f1))"
fi

# ── 2. restore local ──────────────────────────────────────────────────────────

info "A parar o container $APP_CONTAINER (liberta ligações à base)…"
docker stop "$APP_CONTAINER" >/dev/null

info "A recriar a base '$LOCAL_DB'…"
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"$LOCAL_DB\" WITH (FORCE);" >/dev/null
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"$LOCAL_DB\" OWNER postgres;" >/dev/null

info "A restaurar…"
restore_log="$(mktemp)"
trap 'rm -f "$restore_log"' EXIT

if ! docker exec -i "$DB_CONTAINER" pg_restore -U postgres -d "$LOCAL_DB" \
      --no-owner --no-privileges < "$DUMP_FILE" 2>"$restore_log"; then
  warn "pg_restore devolveu erros:"
  grep -E 'error' "$restore_log" | head -20 >&2
  docker start "$APP_CONTAINER" >/dev/null || true
  die "Restore falhou — a base local pode estar incompleta."
fi

# Numa base recriada de raiz o restore deve ser 100% limpo; qualquer erro é sinal
# de que o dump ou o schema mudaram e merece ser visto.
if grep -qE 'error' "$restore_log"; then
  warn "Restore terminou com avisos:"
  grep -E 'error' "$restore_log" | head -10 >&2
fi

ok "Base restaurada"

# ── 3. arranque da API (aplica as migrations pendentes) ───────────────────────

info "A arrancar o $APP_CONTAINER (TypeORM aplica as migrations pendentes)…"
docker start "$APP_CONTAINER" >/dev/null

PORT="$(read_env "$PROJECT_ROOT/.env" PORT || echo 3000)"
API_URL="http://localhost:${PORT}"

api_is_up() {
  [[ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$API_URL/" 2>/dev/null)" != "000" ]]
}

info "À espera da API em $API_URL (até ${HEALTH_TIMEOUT}s)…"
elapsed=0
restarted=false
until api_is_up; do
  sleep 3
  elapsed=$((elapsed + 3))

  # O `nest start --watch` não sai quando o bootstrap rebenta: fica à espera de
  # alterações a ficheiros. Um restart a meio caminho recupera desses casos.
  if [[ $elapsed -ge $((HEALTH_TIMEOUT / 2)) && "$restarted" == false ]]; then
    warn "API ainda em baixo — a reiniciar o container uma vez…"
    docker restart "$APP_CONTAINER" >/dev/null
    restarted=true
  fi

  if [[ $elapsed -ge $HEALTH_TIMEOUT ]]; then
    warn "A API não respondeu a tempo. Últimos logs:"
    docker logs "$APP_CONTAINER" --tail 20 2>&1 | sed 's/\x1b\[[0-9;]*m//g' >&2
    die "Arranque da API falhou (a base ESTÁ restaurada; resolve o arranque e corre com --skip-dump)."
  fi
done

ok "API a responder"

# ── 4. reset da password do admin ─────────────────────────────────────────────

# O SeedService só cria o admin quando o email ainda não existe, por isso após um
# dump de prod o admin local fica com a password de PROD. Repomos a do .env.
if [[ "$SKIP_ADMIN_RESET" == false ]]; then
  ADMIN_EMAIL="$(read_env "$PROJECT_ROOT/.env" ADMIN_EMAIL || true)"
  ADMIN_PASSWORD="$(read_env "$PROJECT_ROOT/.env" ADMIN_PASSWORD || true)"

  if [[ -z "$ADMIN_EMAIL" || -z "$ADMIN_PASSWORD" ]]; then
    warn "ADMIN_EMAIL/ADMIN_PASSWORD não estão no .env — reset do admin ignorado."
  else
    info "A repor a password de ${ADMIN_EMAIL}…"

    # Hash gerado dentro do container, com o bcryptjs do projeto, para garantir
    # os mesmos 12 rounds do CryptoService.
    hash="$(docker exec -e PW="$ADMIN_PASSWORD" "$APP_CONTAINER" \
      node -e 'const b=require("bcryptjs");process.stdout.write(b.hashSync(process.env.PW,b.genSaltSync(12)))')"

    [[ "$hash" == '$2'* ]] || die "Falhou a geração do hash bcrypt."

    updated="$(printf 'UPDATE "user" SET password = %s WHERE email = %s RETURNING 1;\n' \
      "'$hash'" "'$ADMIN_EMAIL'" \
      | docker exec -i "$DB_CONTAINER" psql -U postgres -d "$LOCAL_DB" -tA -v ON_ERROR_STOP=1 \
      | grep -c '^1$' || true)"

    if [[ "$updated" == "0" ]]; then
      warn "Não existe nenhum utilizador com o email $ADMIN_EMAIL — nada foi alterado."
    else
      # Verificação a sério: login pela API.
      code="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API_URL/auth/login" \
        -H 'Content-Type: application/json' \
        --data-binary "$(printf '{"email":"%s","password":"%s"}' "$ADMIN_EMAIL" "$ADMIN_PASSWORD")")"
      if [[ "$code" == "200" || "$code" == "201" ]]; then
        ok "Login do admin confirmado (HTTP $code)"
      else
        warn "Password atualizada mas o login devolveu HTTP $code — verifica manualmente."
      fi
    fi
  fi
fi

# ── resumo ────────────────────────────────────────────────────────────────────

printf '\n'
docker exec "$DB_CONTAINER" psql -U postgres -d "$LOCAL_DB" -c "
SELECT 'user' AS tabela, count(*) FROM \"user\"
UNION ALL SELECT 'collection_request', count(*) FROM collection_request
UNION ALL SELECT 'route', count(*) FROM route
ORDER BY 1;" 2>/dev/null || true

ok "Base local '$LOCAL_DB' sincronizada com a produção."
