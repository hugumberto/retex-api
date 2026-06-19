import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from '../app/services/auth/auth.module';
import { UseCasesModule } from '../app/use-cases/use-cases.module';
import { AuthController } from './auth/auth.controller';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { BlogPostController } from './blog-post/blog-post.controller';
import { FaqController } from './faq/faq.controller';
import { TestZoneController } from './test-zone/test-zone.controller';
import { BrandController } from './brand/brand.controller';
import { MeController } from './me/me.controller';
import { HealthController } from './health/health.controller';
import { ItemController } from './item/item.controller';
import { PackageController } from './package/package.controller';
import { RouteController } from './route/route.controller';
import { StorageUnitController } from './storage-unit/storage-unit.controller';
import { UserController } from './user/user.controller';
import { WelcomeController } from './welcome/welcome.controller';

@Module({
  imports: [
    UseCasesModule.register(),
    TerminusModule,
    AuthModule,
  ],
  controllers: [
    WelcomeController,
    MeController,
    UserController,
    AuthController,
    HealthController,
    PackageController,
    RouteController,
    StorageUnitController,
    BrandController,
    ItemController,
    BlogPostController,
    TestZoneController,
    FaqController,
  ],
  providers: [JwtAuthGuard, RolesGuard],
})
export class ApiModule { }
