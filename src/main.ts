import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';

// Limite de payload partilhado por json/urlencoded (uploads de imagens em base64
// nos posts de blog/hero justificam um limite acima do default do Express).
const BODY_LIMIT = '10mb';

async function bootstrap() {
  const PORT = parseInt(process.env.PORT) || 3000;
  const app = await NestFactory.create(AppModule.register(), {
    bufferLogs: true,
    cors: {
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 200,
      credentials: true,
    },
  });
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      // Remove propriedades não declaradas nos DTOs e ativa a coerção de tipos
      // (DTOs com @Type/@IsInt). forbidNonWhitelisted fica off para não quebrar
      // clientes que enviem campos extra — apenas os ignoramos.
      whitelist: true,
      transform: true,
    }),
  );
  app.use(cookieParser());
  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ limit: BODY_LIMIT, extended: true }));

  const config = new DocumentBuilder()
    .setTitle('Retex API')
    .setDescription('Api to provide data for retex project.')
    .setVersion('1.0')
    .addTag('retex')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'Informe o token JWT no formato: Bearer <token>'
      },
      'bearer',
    )
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(PORT);
}

bootstrap();
