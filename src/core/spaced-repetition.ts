import type { TopicItemInput, TopicStatus } from "./types";

export const INTERVALS_DAYS = [1, 3, 7, 14, 30, 60] as const;

export interface SpacedRepetitionResult {
  status: TopicStatus;
  reviewStep: number;
  lapses: number;
  nextReviewAt: Date | null;
  mastered: boolean;
}

/**
 * Calculates updated spaced repetition parameters upon quiz completion.
 *
 * @param topic Current topic state
 * @param passed Whether the quiz passed
 * @param currentDate Date of quiz attempt (default: today)
 */
export function calculateSpacedRepetition(
  topic: Pick<TopicItemInput, "status" | "reviewStep" | "lapses">,
  passed: boolean,
  currentDate: Date = new Date(),
): SpacedRepetitionResult {
  let lapses = topic.lapses || 0;
  let reviewStep = topic.reviewStep || 0;

  if (passed) {
    // If topic was learning or needs recap, this pass transitions to spaced review
    const nextStep = Math.min(reviewStep + 1, INTERVALS_DAYS.length);
    reviewStep = nextStep;

    if (reviewStep >= INTERVALS_DAYS.length) {
      return {
        status: "MASTERED",
        reviewStep: INTERVALS_DAYS.length,
        lapses,
        nextReviewAt: null,
        mastered: true,
      };
    }

    const intervalDays = INTERVALS_DAYS[reviewStep];
    const nextReview = new Date(currentDate);
    nextReview.setDate(nextReview.getDate() + intervalDays);

    return {
      status: "REVIEWING",
      reviewStep,
      lapses,
      nextReviewAt: nextReview,
      mastered: false,
    };
  }

  // If failed:
  lapses += 1;
  // Step drops by 2 upon lapse (minimum 0)
  reviewStep = Math.max(0, reviewStep - 2);

  return {
    status: "NEEDS_RECAP",
    reviewStep,
    lapses,
    nextReviewAt: null,
    mastered: false,
  };
}
