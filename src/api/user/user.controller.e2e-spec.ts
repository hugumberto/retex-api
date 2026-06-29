import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { DOMAIN_TOKENS } from '../../domain/tokens';
import { Role } from '../../domain/user/user-roles.entity';
import { UserStatus } from '../../domain/user/user-status.enum';
import { UserType } from '../../domain/user/user-type.enum';
import { IUserRepository } from '../../domain/user/user.repository';
import { IUserRoleRepository } from '../../domain/user/user-role.repository';
import { ICryptoService } from '../../app/services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../app/services/tokens';

// e2e da autenticação + RBAC do UserController contra a BD de teste (.env.test).
describe('UserController (e2e) — auth & roles', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  let adminToken: string;
  let userToken: string;
  let createdUserId: string;

  const stamp = Date.now();
  const adminEmail = `admin-${stamp}@e2e.pt`;
  const adminPassword = 'Admin123!';
  const newUserEmail = `created-${stamp}@e2e.pt`;
  const newUserPassword = 'User123!';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule.register()],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    server = app.getHttpServer();

    // Seed de um ADMIN diretamente (o POST /user é agora protegido por ADMIN).
    const userRepo = app.get<IUserRepository>(DOMAIN_TOKENS.USER_REPOSITORY);
    const roleRepo = app.get<IUserRoleRepository>(DOMAIN_TOKENS.USER_ROLE_REPOSITORY);
    const crypto = app.get<ICryptoService>(SERVICE_TOKENS.CRYPTO_SERVICE);

    const admin = await userRepo.create({
      firstName: 'Admin',
      lastName: 'E2E',
      email: adminEmail,
      contactPhone: '1',
      password: await crypto.hashPassword(adminPassword),
      status: UserStatus.ACTIVE,
      userType: UserType.PERSON,
    });
    await roleRepo.create({ user: admin, role: Role.ADMIN });

    const login = await request(server)
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(HttpStatus.OK);
    adminToken = login.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /user (admin only)', () => {
    const body = () => ({
      firstName: 'Created',
      lastName: 'User',
      email: newUserEmail,
      contactPhone: '999',
      password: newUserPassword,
      userType: UserType.PERSON,
    });

    it('rejects an anonymous request with 401', async () => {
      await request(server).post('/user').send(body()).expect(HttpStatus.UNAUTHORIZED);
    });

    it('creates a user (with USER role) when called by an admin', async () => {
      const { body: created } = await request(server)
        .post('/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(body())
        .expect(HttpStatus.CREATED);

      expect(created.firstName).toBe('Created');
      expect(created.email).toBe(newUserEmail);
      expect(created.password).toBeUndefined();
      expect(created.id).toBeTruthy();
      createdUserId = created.id;

      // O novo utilizador faz login (fica ACTIVE) e obtém um token de USER.
      const login = await request(server)
        .post('/auth/login')
        .send({ email: newUserEmail, password: newUserPassword })
        .expect(HttpStatus.OK);
      userToken = login.body.access_token;
    });

    it('forbids a non-admin (USER) from creating users with 403', async () => {
      await request(server)
        .post('/user')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...body(), email: `nope-${stamp}@e2e.pt` })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /user/:id (admin only)', () => {
    it('rejects an anonymous request with 401', async () => {
      await request(server).get(`/user/${createdUserId}`).expect(HttpStatus.UNAUTHORIZED);
    });

    it('forbids a non-admin (USER) with 403', async () => {
      await request(server)
        .get(`/user/${createdUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('returns the user for an admin', async () => {
      const { body } = await request(server)
        .get(`/user/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(body.email).toBe(newUserEmail);
      expect(body.password).toBeUndefined();
    });
  });

  describe('login is blocked for INACTIVE users', () => {
    it('rejects login of a freshly-registered (INACTIVE) account', async () => {
      const email = `inactive-${stamp}@e2e.pt`;
      await request(server)
        .post('/user/register')
        .send({
          firstName: 'In',
          lastName: 'Active',
          email,
          contactPhone: '1',
          address: { street: 'R', number: '1', city: 'Nowhere', zipCode: '0000-000' },
        })
        .expect(HttpStatus.CREATED);

      // Registo gera password aleatória; tentar com uma qualquer → 401 (e INACTIVE).
      await request(server)
        .post('/auth/login')
        .send({ email, password: 'whatever' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
