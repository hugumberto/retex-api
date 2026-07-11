import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { Route, RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { generateFriendlyCode } from '../../qr-code/qr-code.util';
import { CreateRouteDto } from './create-route.dto';

@Injectable()
export class CreateRouteUseCase implements IUseCase<CreateRouteDto, Route> {
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) { }

  async call(param: CreateRouteDto): Promise<Route> {
    // 1. Verificar se o usuário existe e tem role DRIVER
    const driver = await this.userRepository.findOneWithRelations({ id: param.driverId });
    if (!driver) {
      throw new NotFoundException('Driver não encontrado');
    }

    const hasDriverRole = driver.roles?.some(role => role.role === Role.DRIVER);
    if (!hasDriverRole) {
      throw new BadRequestException('Usuário não possui role de driver');
    }

    // 2. Buscar todos os packages pelos IDs (com relações para validar a rota)
    const packages = [];
    for (const packageId of param.packageIds) {
      const packageEntity = await this.packageRepository.findOneWithAllRelations(packageId);
      if (!packageEntity) {
        throw new NotFoundException(`Package com ID ${packageId} não encontrado`);
      }

      // 3. Apenas solicitações no status CREATED podem ser adicionadas
      if (packageEntity.status !== PackageStatus.CREATED) {
        throw new BadRequestException(`Package ${packageId} não está no status CREATED`);
      }

      // 4. Uma solicitação existe em no máximo uma rota
      if (packageEntity.route) {
        throw new ConflictException(`Package ${packageId} já está associado a uma rota`);
      }

      packages.push(packageEntity);
    }

    // 5. Criar a route no status DRAFTING (packages permanecem CREATED)
    const routeData: Partial<Route> = {
      status: RouteStatus.DRAFTING,
      friendlyCode: await this.generateUniqueFriendlyCode(),
      collectionInterval: param.collectionInterval,
      driver: driver,
      packages: packages,
      startDate: new Date(param.startDate),
    };

    // A rota nasce DRAFTING; o email de confirmação só é enviado quando a rota
    // passa para CREATED (ver update-route-use-case).
    return this.routeRepository.create(routeData);
  }

  /**
   * Gera um código amigável (`ano-XXXXXX`) único contra as rotas existentes. O
   * índice único na coluna é a rede de segurança final.
   */
  private async generateUniqueFriendlyCode(): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateFriendlyCode(year);
      const existing = await this.routeRepository.findOne({
        friendlyCode: code,
      } as Partial<Route>);
      if (!existing) return code;
    }
    return `${generateFriendlyCode(year)}${Date.now().toString(36).slice(-2).toUpperCase()}`;
  }
}