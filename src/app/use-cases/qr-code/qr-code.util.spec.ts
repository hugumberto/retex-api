import { generateBatchId, generateFriendlyCode, generateToken } from './qr-code.util';

describe('qr-code.util', () => {
  it('generates a friendly code as `year-XXXXXX` with 6 unambiguous chars', () => {
    const code = generateFriendlyCode(2026);
    expect(code).toMatch(/^2026-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('generates hex tokens', () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('generates unique batch ids (uuid)', () => {
    expect(generateBatchId()).not.toBe(generateBatchId());
    expect(generateBatchId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
