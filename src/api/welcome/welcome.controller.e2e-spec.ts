import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('WelcomeController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule.register()],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/ (GET)', () => {
    it('should return a welcome message', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/')
        .expect(HttpStatus.OK);

      expect(body.message).toBe('Welcome to Fita Project 😎');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
