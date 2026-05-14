export const EXPORT_VERSION = 1;

export type ExportNote = {
  word: string;
  lessonSlug: string;
  collectionSlug: string;
  note: string;
};

export type ExportSuspended = {
  word: string;
  lessonSlug: string;
  collectionSlug: string;
};

export type ExportCardContent = {
  word: string;
  ipa: string | null;
  pos: string | null;
  cefr: string | null;
  definitions: unknown;
  mnemonic_vi: string | null;
};

export type ExportCustomLesson = {
  slug: string;
  name: string;
  cards: ExportCardContent[];
};

export type ExportCustomCollection = {
  slug: string;
  name: string;
  description: string | null;
  topics: Array<{
    slug: string;
    name: string;
    lessons: ExportCustomLesson[];
  }>;
};

export type ExportData = {
  version: typeof EXPORT_VERSION;
  exportedAt: string; // ISO-8601 UTC
  profile: {
    displayName: string | null;
    timezone: string;
    dailyNewCards: number;
    dailyReviewMax: number;
  };
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalReviews: number;
    totalCardsMature: number;
    lastActiveDate: string | null;
  };
  notes: ExportNote[];
  suspended: ExportSuspended[];
  customCollections: ExportCustomCollection[];
};

export type ExportResult = { ok: true; data: ExportData } | { ok: false; error: string };

/**
 * Build the export filename. Short user id keeps the filename readable
 * without leaking the full UUID into download history.
 *   enstudy-export-<8charPrefix>-<YYYY-MM-DD>.json
 */
export function exportFilename(userId: string, now: Date = new Date()): string {
  const shortId = userId.slice(0, 8);
  const date = now.toISOString().slice(0, 10);
  return `enstudy-export-${shortId}-${date}.json`;
}
