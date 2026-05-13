import { describe, expect, it } from 'vitest';
import {
  Rating,
  State,
  fromDbState,
  initialFsrsState,
  rate,
  toDbState,
  type DbCardState,
} from './fsrs';

const NOW = new Date('2026-05-12T10:00:00Z');

describe('state mapping', () => {
  it('round-trips every DB state through ts-fsrs enum', () => {
    const all: DbCardState[] = ['new', 'learning', 'review', 'relearning'];
    for (const s of all) {
      expect(toDbState(fromDbState(s))).toBe(s);
    }
  });

  it('maps new → State.New (0)', () => {
    expect(fromDbState('new')).toBe(State.New);
    expect(toDbState(State.New)).toBe('new');
  });

  it('maps review → State.Review (2)', () => {
    expect(fromDbState('review')).toBe(State.Review);
    expect(toDbState(State.Review)).toBe('review');
  });
});

describe('initialFsrsState', () => {
  it('produces FSRS defaults for a brand-new user_card', () => {
    const s = initialFsrsState(NOW);
    expect(s.state).toBe('new');
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(0);
    expect(s.stability).toBe(0);
    expect(s.difficulty).toBe(0);
    expect(s.lastReview).toBe(null);
    expect(s.due).toBeInstanceOf(Date);
  });
});

function makeCard(overrides: Partial<Parameters<typeof rate>[0]> = {}): Parameters<typeof rate>[0] {
  return {
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: 'new',
    due: NOW,
    lastReview: null,
    ...overrides,
  };
}

describe('rate (new card)', () => {
  it('Again → learning, reps=1, due soon (≤ 10min)', () => {
    const { next, fsrsLog } = rate(makeCard(), Rating.Again, NOW);
    expect(next.state).toBe('learning');
    expect(next.reps).toBe(1);
    expect(fsrsLog.stateBefore).toBe('new');
    expect(fsrsLog.stateAfter).toBe('learning');
    expect(fsrsLog.rating).toBe(Rating.Again);
    const minutes = (next.due.getTime() - NOW.getTime()) / 60_000;
    expect(minutes).toBeGreaterThan(0);
    expect(minutes).toBeLessThanOrEqual(10);
  });

  it('Easy → review (graduates immediately), reps=1, due ≥ 1 day', () => {
    const { next } = rate(makeCard(), Rating.Easy, NOW);
    expect(next.state).toBe('review');
    expect(next.reps).toBe(1);
    const days = (next.due.getTime() - NOW.getTime()) / (24 * 60 * 60_000);
    expect(days).toBeGreaterThanOrEqual(1);
  });

  it('Good → learning or review, reps=1', () => {
    const { next } = rate(makeCard(), Rating.Good, NOW);
    expect(['learning', 'review']).toContain(next.state);
    expect(next.reps).toBe(1);
  });
});

describe('rate (review card)', () => {
  it('Again on review → relearning, lapses += 1', () => {
    const reviewCard = makeCard({
      state: 'review',
      reps: 5,
      lapses: 0,
      stability: 10,
      difficulty: 6,
      scheduledDays: 12,
      elapsedDays: 12,
      lastReview: new Date(NOW.getTime() - 12 * 24 * 60 * 60_000),
    });
    const { next, fsrsLog } = rate(reviewCard, Rating.Again, NOW);
    expect(next.state).toBe('relearning');
    expect(next.lapses).toBe(1);
    expect(fsrsLog.stateBefore).toBe('review');
    expect(fsrsLog.stateAfter).toBe('relearning');
  });

  it('Good on review → stays review, scheduled interval grows', () => {
    const reviewCard = makeCard({
      state: 'review',
      reps: 5,
      lapses: 0,
      stability: 10,
      difficulty: 6,
      scheduledDays: 12,
      elapsedDays: 12,
      lastReview: new Date(NOW.getTime() - 12 * 24 * 60 * 60_000),
    });
    const { next } = rate(reviewCard, Rating.Good, NOW);
    expect(next.state).toBe('review');
    expect(next.scheduledDays).toBeGreaterThan(0);
    expect(next.lapses).toBe(0);
  });
});

describe('rate (lastReview propagation)', () => {
  it('writes lastReview = now after any rating', () => {
    const { next } = rate(makeCard(), Rating.Good, NOW);
    expect(next.lastReview).toBeInstanceOf(Date);
    expect(next.lastReview?.getTime()).toBe(NOW.getTime());
  });
});
