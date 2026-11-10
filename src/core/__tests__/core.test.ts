import { describe, expect, it } from "vitest";
import { generateDayPlan } from "../scheduler";
import { calculateScore } from "../scoring";
import {
  calculateSpacedRepetition,
  INTERVALS_DAYS,
} from "../spaced-repetition";
import type { RubricConcept, TopicItemInput } from "../types";

describe("Scoring Engine", () => {
  const sampleRubric: RubricConcept[] = [
    {
      concept: "Separate build and runtime stages",
      weight: 40,
      mustMention: true,
    },
    {
      concept: "Minimize final image size",
      weight: 30,
      mustMention: false,
    },
    {
      concept: "Security benefits of omitting build tools in prod",
      weight: 30,
      mustMention: false,
    },
  ];

  it("calculates 100% when all concepts are fully covered", () => {
    const result = calculateScore({
      rubric: sampleRubric,
      evaluations: [
        {
          concept: "Separate build and runtime stages",
          coverage: "full",
          evidence: "uses multi-stage builds to split build and runtime",
        },
        {
          concept: "Minimize final image size",
          coverage: "full",
          evidence: "keeps only artifacts so image size is minimal",
        },
        {
          concept: "Security benefits of omitting build tools in prod",
          coverage: "full",
          evidence: "no compilers or sdk in production image",
        },
      ],
      passScore: 70,
    });

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.capped).toBe(false);
  });

  it("caps score at 60 if a mustMention concept is missing even if other answers are great", () => {
    const rubricWithHighOtherWeights: RubricConcept[] = [
      {
        concept: "Separate build and runtime stages",
        weight: 20,
        mustMention: true,
      },
      {
        concept: "Minimize final image size",
        weight: 40,
        mustMention: false,
      },
      {
        concept: "Security benefits of omitting build tools in prod",
        weight: 40,
        mustMention: false,
      },
    ];

    const result = calculateScore({
      rubric: rubricWithHighOtherWeights,
      evaluations: [
        {
          concept: "Separate build and runtime stages",
          coverage: "missing",
          evidence: "",
        },
        {
          concept: "Minimize final image size",
          coverage: "full",
          evidence: "reduces footprint",
        },
        {
          concept: "Security benefits of omitting build tools in prod",
          coverage: "full",
          evidence: "removes build tool vulnerabilities",
        },
      ],
      passScore: 70,
    });

    // Raw score is 0 + 40 + 40 = 80, but capped at 60
    expect(result.rawScore).toBe(80);
    expect(result.score).toBe(60);
    expect(result.passed).toBe(false); // passScore is 70
    expect(result.capped).toBe(true);
  });

  it("awards 50% for partial coverage", () => {
    const result = calculateScore({
      rubric: sampleRubric,
      evaluations: [
        {
          concept: "Separate build and runtime stages",
          coverage: "partial",
          evidence: "briefly mentions multiple FROM lines",
        },
        {
          concept: "Minimize final image size",
          coverage: "partial",
          evidence: "says it's lighter",
        },
        {
          concept: "Security benefits of omitting build tools in prod",
          coverage: "missing",
          evidence: "",
        },
      ],
      passScore: 70,
    });

    // 40*0.5 + 30*0.5 + 0 = 20 + 15 = 35
    expect(result.score).toBe(35);
    expect(result.passed).toBe(false);
  });
});

describe("Spaced Repetition Engine", () => {
  it("advances step and sets review date on pass", () => {
    const today = new Date("2026-11-10T00:00:00Z");
    const result = calculateSpacedRepetition(
      { status: "LEARNING", reviewStep: 0, lapses: 0 },
      true,
      today,
    );

    expect(result.status).toBe("REVIEWING");
    expect(result.reviewStep).toBe(1);
    expect(result.lapses).toBe(0);
    // Interval for step 1 is INTERVALS_DAYS[1] = 3 days
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() + INTERVALS_DAYS[1]);
    expect(result.nextReviewAt?.toISOString()).toBe(expectedDate.toISOString());
  });

  it("marks MASTERED when final interval step is completed", () => {
    const today = new Date("2026-11-10T00:00:00Z");
    const result = calculateSpacedRepetition(
      { status: "REVIEWING", reviewStep: INTERVALS_DAYS.length - 1, lapses: 0 },
      true,
      today,
    );

    expect(result.status).toBe("MASTERED");
    expect(result.mastered).toBe(true);
    expect(result.nextReviewAt).toBeNull();
  });

  it("decreases step by 2 and marks NEEDS_RECAP on failure", () => {
    const today = new Date("2026-11-10T00:00:00Z");
    const result = calculateSpacedRepetition(
      { status: "REVIEWING", reviewStep: 3, lapses: 1 },
      false,
      today,
    );

    expect(result.status).toBe("NEEDS_RECAP");
    expect(result.reviewStep).toBe(1); // 3 - 2 = 1
    expect(result.lapses).toBe(2);
    expect(result.nextReviewAt).toBeNull();
  });
});

describe("Scheduler Engine", () => {
  const dummyTopic = (
    id: string,
    title: string,
    minutes: number,
  ): TopicItemInput => ({
    id,
    title,
    orderIndex: 0,
    estimatedMinutes: minutes,
    status: "NOT_STARTED",
    reviewStep: 0,
    lapses: 0,
  });

  it("respects rest weekdays and generates empty plan", () => {
    // 2026-11-15 is Sunday (day 0)
    const result = generateDayPlan({
      dateStr: "2026-11-15",
      settings: {
        dailyCapMinutes: 240,
        recapCapMinutes: 30,
        restWeekdays: [0], // Sunday is rest day
        timezone: "Asia/Dhaka",
      },
      dueReviews: [],
      needsRecap: [],
      carryOverTopics: [],
      upcomingTopics: [dummyTopic("1", "DSA Binary Search", 90)],
    });

    expect(result.isRestDay).toBe(true);
    expect(result.items.length).toBe(0);
    expect(result.totalPlannedMinutes).toBe(0);
  });

  it("prioritizes RECAP and REVIEW within recap cap, then carry-over and upcoming topics within daily cap", () => {
    const recapTopic = {
      ...dummyTopic("recap-1", "Docker Basics", 60),
      status: "NEEDS_RECAP" as const,
    };
    const reviewTopic = {
      ...dummyTopic("review-1", "SQL Indexes", 45),
      status: "REVIEWING" as const,
      nextReviewAt: new Date("2026-11-09T00:00:00Z"),
    };
    const carryTopic = dummyTopic("carry-1", "Redis Caching", 90);
    const upcoming1 = dummyTopic("up-1", "Kafka Queues", 90);
    const upcoming2 = dummyTopic("up-2", "System Design Sharding", 120);

    const result = generateDayPlan({
      dateStr: "2026-11-10",
      settings: {
        dailyCapMinutes: 240,
        recapCapMinutes: 40,
        restWeekdays: [],
        timezone: "Asia/Dhaka",
      },
      dueReviews: [reviewTopic],
      needsRecap: [recapTopic],
      carryOverTopics: [{ topic: carryTopic, remainingMinutes: 60 }],
      upcomingTopics: [upcoming1, upcoming2],
    });

    expect(result.isRestDay).toBe(false);
    // Recap takes 30 min (capped recap budget is 40). Review needs 20 min which exceeds remaining 10 min recap budget.
    // So items:
    // 1. RECAP Docker Basics (30 min)
    // 2. LEARN Redis Caching carryover (60 min)
    // 3. LEARN Kafka Queues upcoming (90 min)
    // Remaining budget = 240 - 30 - 60 - 90 = 60 min.
    // upcoming2 is 120 min, which exceeds 60 min, so it's skipped for today!
    expect(result.items.map((i) => i.topicTitle)).toEqual([
      "Docker Basics",
      "Redis Caching",
      "Kafka Queues",
    ]);
    expect(result.totalPlannedMinutes).toBe(180);
    expect(result.totalPlannedMinutes).toBeLessThanOrEqual(240);
  });
});
