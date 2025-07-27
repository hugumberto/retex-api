import { Body, Controller, Post } from "@nestjs/common";
import { CreatePackageUseCase } from "../../app/use-cases/package/create-package-use-case";
import { CreatePackageDto } from "../../app/use-cases/package/create-package-use-case/create-package.dto";

@Controller('package')
export class PackageController {
  constructor(
    private readonly createPackageUseCase: CreatePackageUseCase,
  ) { }

  @Post()
  createPackage(@Body() body: CreatePackageDto) {
    return this.createPackageUseCase.call(body);
  }
}