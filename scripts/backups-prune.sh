#!/usr/bin/env bash
#
# Apaga os dumps rodados antigos de backups/, ficando com os mais recentes.
#
# O db-refresh-from-prod.sh guarda o dump anterior como `prd.dump.bak-<epoch>`
# sempre que corre; sem limpeza a pasta cresce o tamanho de um dump (hoje ~8 MB)
# a cada refresh. Este script fica com os N mais recentes — 2, por omissão — e
# apaga os restantes. O dump atual (`prd.dump`) nunca é tocado.
#
# Corre sozinho no fim de cada `yarn db:refresh`. À mão:
#
#   yarn db:prune                      # mantém os 2 mais recentes
#   scripts/backups-prune.sh --keep 5
#   scripts/backups-prune.sh --dry-run # mostra o que apagaria
#
# Opções:
#   --keep N     Quantos .bak manter (omissão: 2; 0 apaga todos)
#   --dry-run    Lista o que seria apagado, sem apagar
#   -q, --quiet  Só escreve se apagar alguma coisa (para correr encadeado)
#   -h, --help   Mostra esta ajuda

set -euo pipefail

readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly BACKUPS_DIR="$PROJECT_ROOT/backups"
readonly PREFIX="prd.dump.bak-"

KEEP="${KEEP:-2}"
DRY_RUN=false
QUIET=false

# ── output ────────────────────────────────────────────────────────────────────

info()  { [[ "$QUIET" == true ]] || printf '\033[0;34m▸\033[0m %s\n' "$*"; }
ok()    { printf '\033[0;32m✓\033[0m %s\n' "$*"; }
die()   { printf '\033[0;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

# Imprime o cabeçalho do próprio ficheiro, até à primeira linha que não é comentário.
usage() { awk 'NR>2 && /^#/ { sub(/^# ?/, ""); print; next } NR>2 { exit }' "${BASH_SOURCE[0]}"; }

# ── argumentos ────────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep)     KEEP="${2:-}"; shift ;;
    --keep=*)   KEEP="${1#*=}" ;;
    --dry-run)  DRY_RUN=true ;;
    -q|--quiet) QUIET=true ;;
    -h|--help)  usage; exit 0 ;;
    *)          die "Opção desconhecida: $1 (usa --help)" ;;
  esac
  shift
done

[[ "$KEEP" =~ ^[0-9]+$ ]] || die "--keep tem de ser um número inteiro (recebeu: '${KEEP}')."

# ── limpeza ───────────────────────────────────────────────────────────────────

[[ -d "$BACKUPS_DIR" ]] || { info "Não existe backups/ — nada a fazer."; exit 0; }
cd "$BACKUPS_DIR"

# O sufixo é o `date +%s` do refresh (10 dígitos até 2286), por isso a ordem
# alfabética inversa é a cronológica: o mais recente primeiro.
list_backups() { ls -1 "$PREFIX"* 2>/dev/null | sort -r; }

total="$(list_backups | wc -l | tr -d ' ')"
if [[ "$total" -eq 0 ]]; then
  info "Sem dumps rodados em backups/ — nada a limpar."
  exit 0
fi

if [[ "$total" -le "$KEEP" ]]; then
  info "backups/ tem $total dump(s) rodado(s), dentro do limite de $KEEP — nada a limpar."
  exit 0
fi

index=0
removed=0
freed_kb=0

while IFS= read -r file; do
  index=$((index + 1))
  [[ $index -gt $KEEP ]] || continue

  size_kb="$(du -k "$file" | cut -f1)"

  if [[ "$DRY_RUN" == true ]]; then
    info "apagaria $file ($((size_kb / 1024)) MB)"
  else
    rm -f "$file"
    info "apagado $file ($((size_kb / 1024)) MB)"
  fi

  removed=$((removed + 1))
  freed_kb=$((freed_kb + size_kb))
done < <(list_backups)

verb="Libertados"
[[ "$DRY_RUN" == false ]] || verb="Libertaria"
ok "$verb $((freed_kb / 1024)) MB em $removed dump(s); ficam os $KEEP mais recentes."
