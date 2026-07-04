import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
import { ConfirmCollectionUseCase } from '../../app/use-cases/package/confirm-collection-use-case';
import { ConfirmCollectionDto } from '../../app/use-cases/package/confirm-collection-use-case/confirm-collection.dto';
import { CreatePackageUseCase } from '../../app/use-cases/package/create-package-use-case';
import { CreatePackageDto } from '../../app/use-cases/package/create-package-use-case/create-package.dto';
import { GetAllPackagesUseCase } from '../../app/use-cases/package/get-all-packages-use-case';
import { GetCreatedPackagesUseCase } from '../../app/use-cases/package/get-created-packages-use-case';
import { GetCreatedPackagesDto } from '../../app/use-cases/package/get-created-packages-use-case/get-created-packages.dto';
import { GetPackageByIdUseCase } from '../../app/use-cases/package/get-package-by-id-use-case';
import { UpdatePackageUseCase } from '../../app/use-cases/package/update-package-use-case';
import { UpdatePackageDto } from '../../app/use-cases/package/update-package-use-case/update-package.dto';
import { Role } from '../../domain/user/user-roles.entity';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

function requesterFrom(req: Request): { id: string; isPrivileged: boolean } {
  const user = req['user'] as JwtPayload;
  const isPrivileged = !!user?.roles?.some(
    (role) => role === Role.ADMIN || role === Role.OPS,
  );
  return { id: user?.sub, isPrivileged };
}

@Controller('package')
export class PackageController {
  constructor(
    private readonly createPackageUseCase: CreatePackageUseCase,
    private readonly getCreatedPackagesUseCase: GetCreatedPackagesUseCase,
    private readonly getPackageByIdUseCase: GetPackageByIdUseCase,
    private readonly updatePackageUseCase: UpdatePackageUseCase,
    private readonly getAllPackagesUseCase: GetAllPackagesUseCase,
    private readonly confirmCollectionUseCase: ConfirmCollectionUseCase,
  ) {}

  @Post('confirm-collection')
  @Public()
  confirmCollection(@Body() body: ConfirmCollectionDto) {
    return this.confirmCollectionUseCase.call(body);
  }

  @Get()
  @Roles(Role.ADMIN, Role.OPS)
  getAll() {
    return this.getAllPackagesUseCase.call();
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  createPackage(@Req() req: Request, @Body() body: CreatePackageDto) {
    const { id, isPrivileged } = requesterFrom(req);
    // Um USER só pode criar pacotes para si próprio; ADMIN/OPS podem indicar o userId.
    const userId = isPrivileged ? body.userId : id;
    return this.createPackageUseCase.call({ ...body, userId });
  }

  @Get('created')
  @Roles(Role.ADMIN, Role.OPS, Role.DRIVER)
  getCreatedPackages(@Query() query: GetCreatedPackagesDto) {
    return this.getCreatedPackagesUseCase.call(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  getPackageById(@Req() req: Request, @Param('id') id: string) {
    const { id: requesterId, isPrivileged } = requesterFrom(req);
    return this.getPackageByIdUseCase.call({ id, requesterId, isPrivileged });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  updatePackage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdatePackageDto,
  ) {
    const { id: requesterId, isPrivileged } = requesterFrom(req);
    return this.updatePackageUseCase.call({
      id,
      data: body,
      requesterId,
      isPrivileged,
    });
  }
}
