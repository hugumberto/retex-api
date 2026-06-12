# Contributing — retex-api

## Commit Guidelines

Formato obrigatório (enforçado via commitlint + husky):

```
type(scope): descrição em português
```

### Tipos

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adição ou correção de testes |
| `docs` | Documentação |
| `chore` | Build, config, dependências, CI |
| `style` | Formatação, lint (sem mudança de lógica) |
| `perf` | Melhoria de performance |
| `revert` | Reversão de commit anterior |

### Scopes

| Scope | Módulo |
|-------|--------|
| `auth` | Autenticação, JWT, refresh tokens |
| `user` | Gestão de usuários |
| `driver` | Módulo de motoristas |
| `ops` | Módulo de operações |
| `roles` | Guards, permissões, RBAC |
| `db` | Migrations, entities, TypeORM config |
| `common` | Decorators, filters, pipes, interceptors compartilhados |
| `config` | Variáveis de ambiente, configuração da app |
| `infra` | Docker, CI, scripts de build |

### Exemplos

```bash
feat(auth): adicionar endpoint de refresh token
fix(user): corrigir hash de senha no cadastro
refactor(common): extrair guard de roles para módulo próprio
chore(db): adicionar migration de tabela de operações
test(auth): adicionar testes de integração para login
chore(infra): atualizar docker-compose para node 20
```

### Breaking changes

```bash
feat(auth)!: alterar formato do payload do JWT

BREAKING CHANGE: campo userId renomeado para sub
```
