import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        // O @nestjs/jwt tipa `expiresIn` como número de segundos ou string no
        // formato do `ms` ("1d", "15m") — um template literal type. O valor vem
        // do .env como string simples, daí a asserção.
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        } as JwtSignOptions,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}
