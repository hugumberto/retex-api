import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CompanyMember, CompanyMemberStatus } from '../../../domain/company/company-member.entity';
import {
  CompanyPermission,
  CompanyProfileKey,
} from '../../../domain/company/company-profile.entity';
import { CompanyStatus } from '../../../domain/company/company.entity';
import { ICompanyMemberRepository } from '../../../domain/company/company.repository';
import { DOMAIN_TOKENS } from '../../../domain/tokens';
import { CompanyContextService } from './company-context.service';

describe('CompanyContextService', () => {
  const companyMemberRepository = mock<ICompanyMemberRepository>();
  let service: CompanyContextService;

  const member = (over: Partial<CompanyMember> = {}) =>
    ({
      userId: 'u1',
      companyId: 'c1',
      profileId: 'p1',
      status: CompanyMemberStatus.ACTIVE,
      company: { id: 'c1', status: CompanyStatus.ACTIVE },
      profile: {
        key: CompanyProfileKey.MANAGER,
        permissions: [CompanyPermission.REQUEST_VIEW_ALL],
      },
      ...over,
    }) as CompanyMember;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CompanyContextService,
        { provide: DOMAIN_TOKENS.COMPANY_MEMBER_REPOSITORY, useValue: companyMemberRepository },
      ],
    }).compile();
    service = module.get(CompanyContextService);
  });

  it('resolves the context of an active member', async () => {
    companyMemberRepository.findByUserWithRelations.mockResolvedValue(member());

    const context = await service.resolve('u1');

    expect(context?.companyId).toBe('c1');
    expect(context?.permissions).toContain(CompanyPermission.REQUEST_VIEW_ALL);
  });

  it('returns null for someone who is not a company member', async () => {
    companyMemberRepository.findByUserWithRelations.mockResolvedValue(null);
    expect(await service.resolve('u1')).toBeNull();
  });

  // Um acesso revogado tem de deixar de valer de imediato — é por isto que o
  // contexto se resolve da BD e não do JWT.
  it('returns null when the membership is suspended', async () => {
    companyMemberRepository.findByUserWithRelations.mockResolvedValue(
      member({ status: CompanyMemberStatus.INACTIVE }),
    );
    expect(await service.resolve('u1')).toBeNull();
  });

  it('returns null when the company itself is inactive', async () => {
    companyMemberRepository.findByUserWithRelations.mockResolvedValue(
      member({ company: { id: 'c1', status: CompanyStatus.INACTIVE } as never }),
    );
    expect(await service.resolve('u1')).toBeNull();
  });

  it('returns null without hitting the repository when there is no user', async () => {
    expect(await service.resolve('')).toBeNull();
    expect(companyMemberRepository.findByUserWithRelations).not.toHaveBeenCalled();
  });

  describe('can', () => {
    it('is false for a null context', () => {
      expect(
        CompanyContextService.can(null, CompanyPermission.MEMBER_MANAGE),
      ).toBe(false);
    });
  });
});
