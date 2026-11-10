import type { TopicItemInput, UserSettingsData } from "./types";

export interface GenerateDayPlanInput {
  dateStr: string; // YYYY-MM-DD format
  settings: Pick<
    UserSettingsData,
    "dailyCapMinutes" | "recapCapMinutes" | "restWeekdays" | "timezone"
  >;
  dueReviews: TopicItemInput[];
  needsRecap: TopicItemInput[];
  carryOverTopics: Array<{
    topic: TopicItemInput;
    remainingMinutes?: number;
    carriedFromDate?: string;
  }>;
  upcomingTopics: TopicItemInput[];
}

export interface DayPlanResult {
  isRestDay: boolean;
  items: Array<{
    topicId: string;
    topicTitle: string;
    type: "LEARN" | "RECAP" | "REVIEW";
    plannedMinutes: number;
    carriedFromDate?: string;
    orderIndex: number;
  }>;
  totalPlannedMinutes: number;
  backlogCount: number;
}

/**
 * Deterministic Day Plan Generator.
 * Implements the core scheduler logic without database or AI dependencies.
 */
export function generateDayPlan(input: GenerateDayPlanInput): DayPlanResult {
  const {
    dateStr,
    settings,
    dueReviews,
    needsRecap,
    carryOverTopics,
    upcomingTopics,
  } = input;

  const targetDate = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = targetDate.getUTCDay(); // 0=Sunday, 6=Saturday

  // 1. Check if it's a designated rest day
  if (settings.restWeekdays?.includes(dayOfWeek)) {
    return {
      isRestDay: true,
      items: [],
      totalPlannedMinutes: 0,
      backlogCount: carryOverTopics.length,
    };
  }

  const items: DayPlanResult["items"] = [];
  let orderIndex = 0;
  let remainingBudget = settings.dailyCapMinutes;
  let recapBudget = Math.min(settings.recapCapMinutes, remainingBudget);

  // 2. RECAP: needsRecap topics (oldest first or order index)
  for (const topic of needsRecap) {
    const recapMinutes = Math.min(topic.estimatedMinutes, 30); // Recap is typically a focused 20-30 min review
    if (recapBudget >= recapMinutes || items.length === 0) {
      items.push({
        topicId: topic.id,
        topicTitle: topic.title,
        type: "RECAP",
        plannedMinutes: recapMinutes,
        orderIndex: orderIndex++,
      });
      recapBudget -= recapMinutes;
      remainingBudget -= recapMinutes;
    }
  }

  // 3. REVIEW: Spaced repetition due reviews (most overdue first)
  const sortedDueReviews = [...dueReviews].sort((a, b) => {
    const timeA = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
    const timeB = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
    return timeA - timeB; // Most overdue first
  });

  for (const topic of sortedDueReviews) {
    const reviewMinutes = Math.min(topic.estimatedMinutes, 20); // Quick spaced recall check
    if (recapBudget >= reviewMinutes && remainingBudget >= reviewMinutes) {
      items.push({
        topicId: topic.id,
        topicTitle: topic.title,
        type: "REVIEW",
        plannedMinutes: reviewMinutes,
        orderIndex: orderIndex++,
      });
      recapBudget -= reviewMinutes;
      remainingBudget -= reviewMinutes;
    }
  }

  // 4. Carry-Over LEARN topics (high priority)
  for (const carry of carryOverTopics) {
    const minutes = carry.remainingMinutes ?? carry.topic.estimatedMinutes;
    if (remainingBudget >= minutes || items.length === 0) {
      items.push({
        topicId: carry.topic.id,
        topicTitle: carry.topic.title,
        type: "LEARN",
        plannedMinutes: minutes,
        carriedFromDate: carry.carriedFromDate || dateStr,
        orderIndex: orderIndex++,
      });
      remainingBudget -= minutes;
    }
  }

  // 5. Upcoming NOT_STARTED topics
  for (const topic of upcomingTopics) {
    const minutes = topic.estimatedMinutes;
    if (remainingBudget >= minutes || items.length === 0) {
      items.push({
        topicId: topic.id,
        topicTitle: topic.title,
        type: "LEARN",
        plannedMinutes: minutes,
        orderIndex: orderIndex++,
      });
      remainingBudget -= minutes;
    } else {
      // If item exceeds remaining budget and we already have items planned, leave for next day
      break;
    }
  }

  const totalPlannedMinutes = items.reduce(
    (acc, it) => acc + it.plannedMinutes,
    0,
  );

  return {
    isRestDay: false,
    items,
    totalPlannedMinutes,
    backlogCount: carryOverTopics.length,
  };
}
