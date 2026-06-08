import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { blogPostSchema } from './blog-post/blog-post.schema';
import { brandSchema } from './brand/brand.schema';
import { TEST_DATABASE_CONFIG } from './config/typeorm-test.config';
import { DATABASE_CONFIG } from './config/typeorm.config';
import { deviceSessionSchema } from './device-session/device-session.schema';
import { itemSchema } from './item/item.schema';
import { packageSchema } from './package/package.schema';
import { routeSchema } from './route/route.schema';
import { storageUnitSchema } from './storage-unit/storage-unit.schema';
import { testZoneSchema } from './test-zone/test-zone.schema';
import { userRoleSchema } from './user-role/user-role.schema';
import { refreshTokenSchema } from './user/refresh-token.schema';
import { userSchema } from './user/user.schema';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      process.env.NODE_ENV !== 'test' ? DATABASE_CONFIG : TEST_DATABASE_CONFIG,
    ),
    TypeOrmModule.forFeature([
      userSchema,
      testZoneSchema,
      brandSchema,
      itemSchema,
      packageSchema,
      routeSchema,
      storageUnitSchema,
      userRoleSchema,
      refreshTokenSchema,
      blogPostSchema,
      deviceSessionSchema,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class AppTypeORMModule { }
