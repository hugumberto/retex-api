-- Utilizadores de teste, um por perfil (sem MASTER).
-- Senha de todas as contas: Teste@2026
--
-- O hash bcrypt vai com # no lugar do cifrão, reposto pelo replace() com
-- chr(36): há clientes SQL que leem o cifrão como delimitador de literal e
-- partem o script ao meio. Assim não existe um único cifrão no texto.

WITH senha AS (
  SELECT replace('#2b#12#H3hYAHvbotjmhKf49VcgreDiUx8TfQNzX6y91R0LEWrw6lJB1lG3.', '#', chr(36)) AS hash
),
conta (last_name, email, phone) AS (
  VALUES
    ('Admin',     'admin.teste@retex.pt',     '910000001'),
    ('Operacao',  'ops.teste@retex.pt',       '910000002'),
    ('Motorista', 'motorista.teste@retex.pt', '910000003'),
    ('Cliente',   'cliente.teste@retex.pt',   '910000004')
)
INSERT INTO "user" (first_name, last_name, email, contact_phone, password, status, user_type)
SELECT 'Teste', c.last_name, c.email, c.phone, s.hash, 'ACTIVE', 'PERSON'
  FROM conta c CROSS JOIN senha s
ON CONFLICT (email) DO UPDATE
   SET password   = EXCLUDED.password,
       status     = 'ACTIVE',
       deleted_at = NULL,
       updated_at = now();

DELETE FROM user_role ur
 USING "user" u
 WHERE ur.user_id = u.id
   AND u.email IN ('admin.teste@retex.pt', 'ops.teste@retex.pt',
                   'motorista.teste@retex.pt', 'cliente.teste@retex.pt');

INSERT INTO user_role (user_id, role)
SELECT u.id, perfil.role::user_role_role_enum
  FROM (VALUES
    ('admin.teste@retex.pt',     'ADMIN'),
    ('ops.teste@retex.pt',       'OPS'),
    ('motorista.teste@retex.pt', 'DRIVER'),
    ('cliente.teste@retex.pt',   'USER')
  ) AS perfil (email, role)
  JOIN "user" u ON u.email = perfil.email;

WITH zona AS (
  SELECT city FROM test_zone WHERE deleted_at IS NULL ORDER BY city LIMIT 1
)
INSERT INTO user_address (
  user_id, street, number, city, city_division, country, country_division,
  zip_code, lat, long, is_default, is_in_service_zone, city_normalized
)
SELECT u.id, 'Rua de Teste', '10',
       initcap(COALESCE(z.city, 'maia')),
       initcap(COALESCE(z.city, 'maia')),
       'Portugal', 'Porto', '4470-000',
       41.22800000, -8.62000000,
       true,
       z.city IS NOT NULL,
       COALESCE(z.city, 'maia')
  FROM "user" u
  LEFT JOIN zona z ON true
 WHERE u.email = 'cliente.teste@retex.pt'
   AND NOT EXISTS (
     SELECT 1 FROM user_address a
      WHERE a.user_id = u.id AND a.deleted_at IS NULL
   );

SELECT u.email, ur.role, u.status
  FROM "user" u
  JOIN user_role ur ON ur.user_id = u.id AND ur.deleted_at IS NULL
 WHERE u.email IN ('admin.teste@retex.pt', 'ops.teste@retex.pt',
                   'motorista.teste@retex.pt', 'cliente.teste@retex.pt')
 ORDER BY u.email;
