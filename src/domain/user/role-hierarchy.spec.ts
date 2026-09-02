import {
  expandRoles,
  hasAnyRole,
  isMaster,
  isPrivileged,
} from './role-hierarchy';
import { Role } from './user-roles.entity';

describe('role hierarchy', () => {
  describe('expandRoles', () => {
    it('expands MASTER into ADMIN', () => {
      expect(expandRoles([Role.MASTER]).sort()).toEqual(
        [Role.MASTER, Role.ADMIN].sort(),
      );
    });

    it('leaves the other roles untouched', () => {
      expect(expandRoles([Role.OPS])).toEqual([Role.OPS]);
    });

    it('discards values that are not roles', () => {
      expect(expandRoles(['NOPE', Role.USER])).toEqual([Role.USER]);
    });

    it('tolerates undefined', () => {
      expect(expandRoles(undefined)).toEqual([]);
    });
  });

  describe('hasAnyRole', () => {
    it('lets a MASTER through an ADMIN-only requirement', () => {
      expect(hasAnyRole([Role.MASTER], [Role.ADMIN])).toBe(true);
    });

    it('does not let an ADMIN through a MASTER-only requirement', () => {
      expect(hasAnyRole([Role.ADMIN], [Role.MASTER])).toBe(false);
    });

    it('does not make a MASTER an OPS or a DRIVER', () => {
      expect(hasAnyRole([Role.MASTER], [Role.OPS])).toBe(false);
      expect(hasAnyRole([Role.MASTER], [Role.DRIVER])).toBe(false);
    });
  });

  it('recognises the privileged roles', () => {
    expect(isMaster([Role.MASTER])).toBe(true);
    expect(isMaster([Role.ADMIN])).toBe(false);
    expect(isPrivileged([Role.ADMIN])).toBe(true);
    expect(isPrivileged([Role.OPS])).toBe(false);
  });
});
