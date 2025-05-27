import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.register()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('/health (GET)', () => {
    it('should return database is up', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/health')
        .expect(HttpStatus.OK);

      expect(body.details.postgres.status).toBe('up');
      expect(body.status).toBe('ok');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
