import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../../app/services/interfaces/auth.interface';
import { CompanyContextService } from '../../app/services/company-context/company-context.service';
import { CreateCompanyAddressUseCase } from '../../app/use-cases/company/create-company-address-use-case';
import { CreateCompanyAddressDto } from '../../app/use-cases/company/create-company-address-use-case/create-company-address.dto';
import { CreateCompanyMemberUseCase } from '../../app/use-cases/company/create-company-member-use-case';
import { CreateCompanyMemberDto } from '../../app/use-cases/company/create-company-member-use-case/create-company-member.dto';
import { CreateCompanyUseCase } from '../../app/use-cases/company/create-company-use-case';
import { CreateCompanyDto } from '../../app/use-cases/company/create-company-use-case/create-company.dto';
import { GetAllCompaniesUseCase } from '../../app/use-cases/company/get-all-companies-use-case';
import { GetCompaniesDto } from '../../app/use-cases/company/get-all-companies-use-case/get-companies.dto';
import { GetCompanyByIdUseCase } from '../../app/use-cases/company/get-company-by-id-use-case';
import { GetCompanyAddressesUseCase } from '../../app/use-cases/company/get-company-addresses-use-case';
import { GetCompanyMembersUseCase } from '../../app/use-cases/company/get-company-members-use-case';
import { GetCompanyProfilesUseCase } from '../../app/use-cases/company/get-company-profiles-use-case';
import { UpdateCompanyMemberUseCase } from '../../app/use-cases/company/update-company-member-use-case';
import { UpdateCompanyMemberDto } from '../../app/use-cases/company/update-company-member-use-case/update-company-member.dto';
import { UpdateCompanyUseCase } from '../../app/use-cases/company/update-company-use-case';
import { UpdateCompanyDto } from '../../app/use-cases/company/update-company-use-case/update-company.dto';
import { CompanyPermission } from '../../domain/company/company-profile.entity';
import { Role } from '../../domain/user/user-roles.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('company')
@ApiBearerAuth()
@Controller('company')
@Roles(Role.ADMIN)
export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly getAllCompaniesUseCase: GetAllCompaniesUseCase,
    private readonly getCompanyByIdUseCase: GetCompanyByIdUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly createCompanyMemberUseCase: CreateCompanyMemberUseCase,
    private readonly updateCompanyMemberUseCase: UpdateCompanyMemberUseCase,
    private readonly getCompanyMembersUseCase: GetCompanyMembersUseCase,
    private readonly getCompanyProfilesUseCase: GetCompanyProfilesUseCase,
    private readonly createCompanyAddressUseCase: CreateCompanyAddressUseCase,
    private readonly getCompanyAddressesUseCase: GetCompanyAddressesUseCase,
    private readonly companyContextService: CompanyContextService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Cadastrar empresa e o seu gestor inicial' })
  createCompany(@Body() body: CreateCompanyDto) {
    return this.createCompanyUseCase.call(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  getCompanies(@Query() query: GetCompaniesDto) {
    return this.getAllCompaniesUseCase.call(query);
  }

  // Declarado antes de `:id` para não ser capturado por ele.
  // O gestor gere a sua própria empresa — daí Role.USER aqui.
  @Get('me')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  @ApiOperation({ summary: 'Empresa do utilizador autenticado' })
  async getMyCompany(@CurrentUser() user: JwtPayload) {
    const context = await this.companyContextService.resolve(user.sub);
    if (!context) {
      return null;
    }
    return {
      company: context.company,
      profile: context.profile,
      permissions: context.permissions,
    };
  }

  @Get('me/members')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  @ApiOperation({ summary: 'Membros da empresa do utilizador autenticado' })
  async getMyCompanyMembers(@CurrentUser() user: JwtPayload) {
    const context = await this.requireManager(user);
    return this.getCompanyMembersUseCase.call(context.companyId);
  }

  @Post('me/members')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  @ApiOperation({ summary: 'Criar membro na empresa do utilizador autenticado' })
  async createMyCompanyMember(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateCompanyMemberDto,
  ) {
    const context = await this.requireManager(user);
    return this.createCompanyMemberUseCase.call({
      companyId: context.companyId,
      data: body,
    });
  }

  @Patch('me/members/:memberId')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  @ApiOperation({ summary: 'Atualizar membro da empresa do utilizador' })
  async updateMyCompanyMember(
    @CurrentUser() user: JwtPayload,
    @Param('memberId') memberId: string,
    @Body() body: UpdateCompanyMemberDto,
  ) {
    const context = await this.requireManager(user);
    return this.updateCompanyMemberUseCase.call({
      companyId: context.companyId,
      memberId,
      data: body,
    });
  }

  // Qualquer membro precisa de ver os locais para pedir recolha.
  @Get('me/addresses')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  @ApiOperation({ summary: 'Locais de recolha da empresa do utilizador' })
  async getMyCompanyAddresses(@CurrentUser() user: JwtPayload) {
    const context = await this.companyContextService.resolve(user.sub);
    if (!context) {
      return [];
    }
    return this.getCompanyAddressesUseCase.call(context.companyId);
  }

  @Post('me/addresses')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  @ApiOperation({ summary: 'Criar local de recolha na empresa do utilizador' })
  async createMyCompanyAddress(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateCompanyAddressDto,
  ) {
    const context = await this.require(user, CompanyPermission.ADDRESS_MANAGE);
    return this.createCompanyAddressUseCase.call({
      companyId: context.companyId,
      data: body,
    });
  }

  @Get('me/profiles')
  @Roles(Role.ADMIN, Role.OPS, Role.USER)
  @ApiOperation({ summary: 'Perfis atribuíveis na empresa do utilizador' })
  async getMyCompanyProfiles(@CurrentUser() user: JwtPayload) {
    const context = await this.requireManager(user);
    return this.getCompanyProfilesUseCase.call(context.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter empresa por ID' })
  getCompanyById(@Param('id') id: string) {
    return this.getCompanyByIdUseCase.call(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar empresa' })
  updateCompany(@Param('id') id: string, @Body() body: UpdateCompanyDto) {
    return this.updateCompanyUseCase.call({ id, data: body });
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Listar membros de uma empresa' })
  getCompanyMembers(@Param('id') id: string) {
    return this.getCompanyMembersUseCase.call(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Criar membro numa empresa' })
  createCompanyMember(
    @Param('id') id: string,
    @Body() body: CreateCompanyMemberDto,
  ) {
    return this.createCompanyMemberUseCase.call({ companyId: id, data: body });
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Atualizar membro de uma empresa' })
  updateCompanyMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateCompanyMemberDto,
  ) {
    return this.updateCompanyMemberUseCase.call({
      companyId: id,
      memberId,
      data: body,
    });
  }

  @Get(':id/addresses')
  @ApiOperation({ summary: 'Locais de recolha de uma empresa' })
  getCompanyAddresses(@Param('id') id: string) {
    return this.getCompanyAddressesUseCase.call(id);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Criar local de recolha numa empresa' })
  createCompanyAddress(
    @Param('id') id: string,
    @Body() body: CreateCompanyAddressDto,
  ) {
    return this.createCompanyAddressUseCase.call({ companyId: id, data: body });
  }

  @Get(':id/profiles')
  @ApiOperation({ summary: 'Perfis atribuíveis numa empresa' })
  getCompanyProfiles(@Param('id') id: string) {
    return this.getCompanyProfilesUseCase.call(id);
  }

  /**
   * As rotas `/me/...` estão abertas a `Role.USER` porque é a role global de
   * qualquer membro de empresa. Quem decide o acesso é o perfil, verificado
   * aqui — não o `RolesGuard`, que não conhece empresas.
   */
  private async require(user: JwtPayload, permission: CompanyPermission) {
    const context = await this.companyContextService.resolve(user.sub);
    if (!CompanyContextService.can(context, permission)) {
      throw new ForbiddenException('errors.auth.accessDenied');
    }
    return context;
  }

  private requireManager(user: JwtPayload) {
    return this.require(user, CompanyPermission.MEMBER_MANAGE);
  }
}
