import type { ConceptEvaluation, RubricConcept } from "./types";

export interface ScoreCalculationInput {
  rubric: RubricConcept[];
  evaluations: ConceptEvaluation[];
  passScore: number;
}

export interface ScoreCalculationResult {
  score: number;
  rawScore: number;
  capped: boolean;
  capReason?: string;
  passed: boolean;
}

/**
 * Deterministically computes the score from rubric weights and evaluations.
 * Coverage values:
 * - full: 100% of concept weight
 * - partial: 50% of concept weight
 * - missing: 0%
 *
 * If any `mustMention` concept is missing, score is capped at max 60.
 */
export function calculateScore(
  input: ScoreCalculationInput,
): ScoreCalculationResult {
  const { rubric, evaluations, passScore } = input;

  const evalMap = new Map<string, ConceptEvaluation>();
  for (const item of evaluations) {
    evalMap.set(item.concept.trim().toLowerCase(), item);
  }

  let rawScore = 0;
  let hasMissingMustMention = false;
  let missingMustMentionName = "";

  for (const concept of rubric) {
    const key = concept.concept.trim().toLowerCase();
    const evalResult = evalMap.get(key);
    const coverage = evalResult ? evalResult.coverage : "missing";

    let multiplier = 0;
    if (coverage === "full") {
      multiplier = 1.0;
    } else if (coverage === "partial") {
      multiplier = 0.5;
    } else {
      multiplier = 0;
      if (concept.mustMention) {
        hasMissingMustMention = true;
        missingMustMentionName = concept.concept;
      }
    }

    rawScore += concept.weight * multiplier;
  }

  // Round raw score to integer
  rawScore = Math.round(rawScore);

  let finalScore = rawScore;
  let capped = false;
  let capReason: string | undefined;

  if (hasMissingMustMention && finalScore > 60) {
    finalScore = 60;
    capped = true;
    capReason = `Essential concept "${missingMustMentionName}" was missing. Score capped at 60.`;
  }

  // Ensure score is bounded between 0 and 100
  finalScore = Math.max(0, Math.min(100, finalScore));

  const passed = finalScore >= passScore;

  return {
    score: finalScore,
    rawScore,
    capped,
    capReason,
    passed,
  };
}
