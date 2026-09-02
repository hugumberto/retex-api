import { CollectionRequest } from '../../../domain/collection-request/collection-request.entity';
import {
  CompanyPermission,
  CompanyProfileKey,
  SYSTEM_PROFILE_PERMISSIONS,
} from '../../../domain/company/company-profile.entity';
import { CompanyContext } from '../../services/company-context/company-context.service';
import {
  canAccessCollectionRequest,
  canCancelCollectionRequest,
} from './collection-request-access.util';

const COMPANY_A = 'company-a';
const COMPANY_B = 'company-b';

const request = (userId: string, companyId?: string) =>
  ({ user: { id: userId }, companyId: companyId ?? null }) as CollectionRequest;

const context = (companyId: string, key: CompanyProfileKey): CompanyContext =>
  ({
    companyId,
    company: { id: companyId } as never,
    profile: { key } as never,
    permissions: SYSTEM_PROFILE_PERMISSIONS[key],
  });

describe('canAccessCollectionRequest', () => {
  it('lets ADMIN/OPS see anything', () => {
    expect(
      canAccessCollectionRequest(request('someone', COMPANY_A), 'other', true, null),
    ).toBe(true);
  });

  it('lets the requester see their own, company or not', () => {
    expect(canAccessCollectionRequest(request('me'), 'me', false, null)).toBe(true);
    expect(
      canAccessCollectionRequest(
        request('me', COMPANY_A),
        'me',
        false,
        context(COMPANY_A, CompanyProfileKey.COLLABORATOR),
      ),
    ).toBe(true);
  });

  // A asserção que separa os dois perfis.
  it('lets a MANAGER see a colleague request but not a COLLABORATOR', () => {
    const colleague = request('colleague', COMPANY_A);

    expect(
      canAccessCollectionRequest(
        colleague,
        'me',
        false,
        context(COMPANY_A, CompanyProfileKey.MANAGER),
      ),
    ).toBe(true);

    expect(
      canAccessCollectionRequest(
        colleague,
        'me',
        false,
        context(COMPANY_A, CompanyProfileKey.COLLABORATOR),
      ),
    ).toBe(false);
  });

  it('never crosses companies, even for a MANAGER', () => {
    expect(
      canAccessCollectionRequest(
        request('someone', COMPANY_B),
        'me',
        false,
        context(COMPANY_A, CompanyProfileKey.MANAGER),
      ),
    ).toBe(false);
  });

  it('does not let a company MANAGER see an individual request', () => {
    expect(
      canAccessCollectionRequest(
        request('someone'),
        'me',
        false,
        context(COMPANY_A, CompanyProfileKey.MANAGER),
      ),
    ).toBe(false);
  });
});

describe('canCancelCollectionRequest', () => {
  it('follows REQUEST_CANCEL_ALL, which only the MANAGER has', () => {
    const colleague = request('colleague', COMPANY_A);

    expect(
      SYSTEM_PROFILE_PERMISSIONS[CompanyProfileKey.COLLABORATOR],
    ).not.toContain(CompanyPermission.REQUEST_CANCEL_ALL);

    expect(
      canCancelCollectionRequest(
        colleague,
        'me',
        false,
        context(COMPANY_A, CompanyProfileKey.MANAGER),
      ),
    ).toBe(true);

    expect(
      canCancelCollectionRequest(
        colleague,
        'me',
        false,
        context(COMPANY_A, CompanyProfileKey.COLLABORATOR),
      ),
    ).toBe(false);
  });
});
