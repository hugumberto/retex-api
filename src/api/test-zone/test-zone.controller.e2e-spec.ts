import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { ICryptoService } from '../../app/services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../app/services/tokens';
import { IAddressRepository } from '../../domain/address/address.repository';
import { DOMAIN_TOKENS } from '../../domain/tokens';
import { Role } from '../../domain/user/user-roles.entity';
import { UserStatus } from '../../domain/user/user-status.enum';
import { UserType } from '../../domain/user/user-type.enum';
import { IUserRepository } from '../../domain/user/user.repository';
import { IUserRoleRepository } from '../../domain/user/user-role.repository';

// e2e do fluxo de zona de atuação contra a BD de teste (.env.test).
// Cobre o bug do updateServiceZoneByCity: criar uma zona deve flippar
// `is_in_service_zone` nos endereços dessa cidade (incl. cidades acentuadas).
describe('TestZoneController (e2e) — zona retroativa', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let adminToken: string;

  const stamp = Date.now();
  const adminEmail = `zone-admin-${stamp}@e2e.pt`;
  const adminPassword = 'Admin123!';
  const memberEmail = `zone-member-${stamp}@e2e.pt`;
  // Cidade acentuada + sufixo único: sanitizeString -> "evora<stamp>" tanto na
  // morada como na zona, garantindo match sem colisão entre execuções.
  const city = `Évora-${stamp}`;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule.register()],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    server = app.getHttpServer();

    const userRepo = app.get<IUserRepository>(DOMAIN_TOKENS.USER_REPOSITORY);
    const roleRepo = app.get<IUserRoleRepository>(DOMAIN_TOKENS.USER_ROLE_REPOSITORY);
    const crypto = app.get<ICryptoService>(SERVICE_TOKENS.CRYPTO_SERVICE);

    const admin = await userRepo.create({
      firstName: 'Zone',
      lastName: 'Admin',
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

  it('flips an address into the service zone when its city becomes a zone', async () => {
    // 1) Registo fora-de-zona (nenhuma zona existe ainda para esta cidade).
    const registered = await request(server)
      .post('/user/register')
      .send({
        firstName: 'Zona',
        lastName: 'Membro',
        email: memberEmail,
        contactPhone: '1',
        address: { street: 'R', number: '1', city, zipCode: '0000-000' },
      })
      .expect(HttpStatus.CREATED);

    const userId = registered.body.id;
    expect(userId).toBeTruthy();

    const addressRepo = app.get<IAddressRepository>(DOMAIN_TOKENS.ADDRESS_REPOSITORY);
    const before = await addressRepo.findByUser(userId);
    expect(before[0].isInServiceZone).toBe(false);

    // 2) Admin cria a zona para a mesma cidade (acentuada). Sem o fix do
    //    updateServiceZoneByCity isto daria 500 (coluna "isInServiceZone").
    await request(server)
      .post('/zone')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ city })
      .expect(HttpStatus.CREATED);

    // 3) O endereço passou a estar dentro da zona.
    const after = await addressRepo.findByUser(userId);
    expect(after[0].isInServiceZone).toBe(true);
  });
});
