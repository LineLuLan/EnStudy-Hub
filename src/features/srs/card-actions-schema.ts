import { z } from 'zod';

export const MAX_NOTE_LENGTH = 500;

export const updateUserCardSchema = z
  .object({
    userCardId: z.string().uuid(),
    notes: z.string().max(MAX_NOTE_LENGTH, `Ghi chú tối đa ${MAX_NOTE_LENGTH} ký tự`).optional(),
    suspended: z.boolean().optional(),
  })
  .refine((v) => v.notes !== undefined || v.suspended !== undefined, {
    message: 'Phải có ít nhất 1 thay đổi',
  });

export type UpdateUserCardInput = z.infer<typeof updateUserCardSchema>;
export type UpdateUserCardResult =
  | { ok: true; suspended: boolean; hasNote: boolean }
  | { ok: false; error: string };
