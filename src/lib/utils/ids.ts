/**
 * Generate a client-side review id for idempotent submitReview calls.
 * Used to dedupe double-submit on flaky networks.
 */
export function newClientReviewId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback (rare in supported envs)
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** kebab-case → human readable. */
export function humanize(slug: string): string {
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}
