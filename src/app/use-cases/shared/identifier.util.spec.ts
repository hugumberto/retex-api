import { NotFoundException } from '@nestjs/common';
import { isUuid, resolveEntityId } from './identifier.util';

const UUID = '4f00094b-59b1-45cd-82a9-d6b32357ec07';

describe('isUuid', () => {
  it('accepts a UUID, in any case and with surrounding spaces', () => {
    expect(isUuid(UUID)).toBe(true);
    expect(isUuid(UUID.toUpperCase())).toBe(true);
    expect(isUuid(`  ${UUID}  `)).toBe(true);
  });

  it('rejects a friendly code', () => {
    expect(isUuid('2026-NR38BC')).toBe(false);
    expect(isUuid('')).toBe(false);
  });
});

describe('resolveEntityId', () => {
  it('returns the UUID without hitting the repository', async () => {
    const findByFriendlyCode = jest.fn();

    await expect(
      resolveEntityId(` ${UUID} `, findByFriendlyCode, 'errors.route.notFound'),
    ).resolves.toBe(UUID);
    expect(findByFriendlyCode).not.toHaveBeenCalled();
  });

  it('resolves a friendly code through the repository', async () => {
    const findByFriendlyCode = jest.fn().mockResolvedValue({ id: UUID });

    await expect(
      resolveEntityId('2026-NR38BC', findByFriendlyCode, 'errors.route.notFound'),
    ).resolves.toBe(UUID);
    expect(findByFriendlyCode).toHaveBeenCalledWith('2026-NR38BC');
  });

  it('throws the given i18n key when the code matches nothing', async () => {
    const findByFriendlyCode = jest.fn().mockResolvedValue(null);

    await expect(
      resolveEntityId('nao-existe', findByFriendlyCode, 'errors.route.notFound'),
    ).rejects.toThrow(new NotFoundException('errors.route.notFound'));
  });
});
