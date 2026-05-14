import { describe, expect, it } from 'vitest';
import { updateUserCardSchema, MAX_NOTE_LENGTH } from './card-actions-schema';

const VALID_UUID = '11111111-1111-1111-1111-111111111111';

describe('updateUserCardSchema', () => {
  it('accepts notes-only update', () => {
    const r = updateUserCardSchema.safeParse({ userCardId: VALID_UUID, notes: 'My note' });
    expect(r.success).toBe(true);
  });

  it('accepts suspended-only update', () => {
    const r = updateUserCardSchema.safeParse({ userCardId: VALID_UUID, suspended: true });
    expect(r.success).toBe(true);
  });

  it('accepts both fields together', () => {
    const r = updateUserCardSchema.safeParse({
      userCardId: VALID_UUID,
      notes: 'hi',
      suspended: false,
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty patch (no fields)', () => {
    const r = updateUserCardSchema.safeParse({ userCardId: VALID_UUID });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toContain('Phải có ít nhất 1 thay đổi');
    }
  });

  it('accepts empty note string (used to clear note)', () => {
    const r = updateUserCardSchema.safeParse({ userCardId: VALID_UUID, notes: '' });
    expect(r.success).toBe(true);
  });

  it('rejects oversize note', () => {
    const r = updateUserCardSchema.safeParse({
      userCardId: VALID_UUID,
      notes: 'a'.repeat(MAX_NOTE_LENGTH + 1),
    });
    expect(r.success).toBe(false);
  });

  it('rejects non-UUID userCardId', () => {
    const r = updateUserCardSchema.safeParse({ userCardId: 'not-a-uuid', notes: 'hi' });
    expect(r.success).toBe(false);
  });

  it('rejects non-boolean suspended', () => {
    const r = updateUserCardSchema.safeParse({
      userCardId: VALID_UUID,
      suspended: 'yes' as unknown as boolean,
    });
    expect(r.success).toBe(false);
  });
});
