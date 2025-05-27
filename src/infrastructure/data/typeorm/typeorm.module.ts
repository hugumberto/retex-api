import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TEST_DATABASE_CONFIG } from './config/typeorm-test.config';
import { DATABASE_CONFIG } from './config/typeorm.config';
import { testZoneSchema } from './test-zone/test-zone.schema';
import { userSchema } from './user/user.schema';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      process.env.NODE_ENV !== 'test' ? DATABASE_CONFIG : TEST_DATABASE_CONFIG,
    ),
    TypeOrmModule.forFeature([userSchema, testZoneSchema]),
  ],
  exports: [TypeOrmModule],
})
export class AppTypeORMModule {}
