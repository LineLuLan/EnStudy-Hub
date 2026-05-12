import {
  createEmptyCard,
  fsrs as makeFsrs,
  Rating,
  State,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs';
import type { UserCard } from '@/lib/db/schema';

export { Rating, State };
export type { Grade };

export type DbCardState = 'new' | 'learning' | 'review' | 'relearning';

const DB_TO_FSRS_STATE: Record<DbCardState, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

const FSRS_TO_DB_STATE: Record<State, DbCardState> = {
  [State.New]: 'new',
  [State.Learning]: 'learning',
  [State.Review]: 'review',
  [State.Relearning]: 'relearning',
};

export function toDbState(state: State): DbCardState {
  return FSRS_TO_DB_STATE[state];
}

export function fromDbState(state: DbCardState): State {
  return DB_TO_FSRS_STATE[state];
}

const scheduler = makeFsrs({
  enable_fuzz: true,
  enable_short_term: true,
});

/**
 * Convert a DB user_card row into the shape ts-fsrs operates on.
 * `last_review` is omitted when null because ts-fsrs treats `undefined` as "never reviewed".
 */
export function toFsrsCard(card: {
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: DbCardState;
  due: Date;
  lastReview: Date | null;
}): FsrsCard {
  const base: FsrsCard = {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    state: fromDbState(card.state),
  };
  if (card.lastReview) base.last_review = card.lastReview;
  return base;
}

export type SrsUpdate = Pick<
  UserCard,
  | 'stability'
  | 'difficulty'
  | 'elapsedDays'
  | 'scheduledDays'
  | 'reps'
  | 'lapses'
  | 'state'
  | 'lastReview'
  | 'due'
>;

export function fromFsrsCard(card: FsrsCard): SrsUpdate {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: toDbState(card.state),
    lastReview: card.last_review ?? null,
    due: card.due,
  };
}

export type RateResult = {
  next: SrsUpdate;
  fsrsLog: {
    rating: Rating;
    stateBefore: DbCardState;
    stateAfter: DbCardState;
    scheduledDays: number;
    elapsedDays: number;
    stability: number;
    difficulty: number;
  };
};

/**
 * Apply an FSRS rating to a card and return the next DB state + a structured log
 * suitable for `review_logs.state_before` / `state_after`.
 */
export function rate(
  current: Parameters<typeof toFsrsCard>[0],
  rating: Grade,
  now: Date = new Date()
): RateResult {
  const before = toFsrsCard(current);
  const { card: after, log } = scheduler.next(before, now, rating);
  return {
    next: fromFsrsCard(after),
    fsrsLog: {
      rating,
      stateBefore: current.state,
      stateAfter: toDbState(after.state),
      scheduledDays: log.scheduled_days,
      elapsedDays: log.elapsed_days,
      stability: log.stability,
      difficulty: log.difficulty,
    },
  };
}

/** Default FSRS state for a brand-new user_card row (matches DB defaults). */
export function initialFsrsState(now: Date = new Date()): SrsUpdate {
  return fromFsrsCard(createEmptyCard(now));
}
