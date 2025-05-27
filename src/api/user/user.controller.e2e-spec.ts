import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('UserController', () => {
  let app: INestApplication;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule.register()],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/user (POST)', () => {
    it('should create an user', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'John Doe',
          email: 'john@email.com',
        })
        .expect(HttpStatus.CREATED);

      expect(body.name).toBe('John Doe');
      expect(body.email).toBe('john@email.com');
      expect(body.id).toBeTruthy();
      userId = body.id;
    });
  });

  describe('/user/:id (GET)', () => {
    it('should return an user', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/user/${userId}`)
        .expect(HttpStatus.OK);

      expect(body.name).toBe('John Doe');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
