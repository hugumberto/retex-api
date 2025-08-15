import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CreatePackageUseCase } from "../../app/use-cases/package/create-package-use-case";
import { CreatePackageDto } from "../../app/use-cases/package/create-package-use-case/create-package.dto";
import { GetCreatedPackagesUseCase } from "../../app/use-cases/package/get-created-packages-use-case";
import { GetCreatedPackagesDto } from "../../app/use-cases/package/get-created-packages-use-case/get-created-packages.dto";

@Controller('package')
export class PackageController {
  constructor(
    private readonly createPackageUseCase: CreatePackageUseCase,
    private readonly getCreatedPackagesUseCase: GetCreatedPackagesUseCase,
  ) { }

  @Post()
  createPackage(@Body() body: CreatePackageDto) {
    return this.createPackageUseCase.call(body);
  }

  @Get('created')
  getCreatedPackages(@Query() query: GetCreatedPackagesDto) {
    return this.getCreatedPackagesUseCase.call(query);
  }
}