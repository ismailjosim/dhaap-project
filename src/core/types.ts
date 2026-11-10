export type TopicStatus =
  | "NOT_STARTED"
  | "LEARNING"
  | "QUIZ_PENDING"
  | "PASSED"
  | "REVIEWING"
  | "MASTERED"
  | "NEEDS_RECAP"
  | "DEFERRED";

export type PlanItemType = "LEARN" | "RECAP" | "REVIEW";
export type PlanItemStatus = "PLANNED" | "DONE" | "SKIPPED";
export type RoadmapType = "MAIN" | "SECONDARY";
export type UrgencyLevel = "HIGH" | "MEDIUM" | "LOW";
export type MasteryLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface RubricConcept {
  concept: string;
  weight: number;
  keywords?: string[];
  mustMention: boolean;
}

export interface ConceptEvaluation {
  concept: string;
  coverage: "full" | "partial" | "missing";
  evidence: string;
}

export interface GradingResult {
  conceptResults: ConceptEvaluation[];
  misconceptions: string[];
  strengths: string[];
  improvements: string[];
  communication?: {
    clarity: 1 | 2 | 3 | 4 | 5;
    structure: 1 | 2 | 3 | 4 | 5;
    depth: 1 | 2 | 3 | 4 | 5;
  };
  followUpQuestion?: string;
}

export interface UserSettingsData {
  userId: string;
  timezone: string;
  dailyCapMinutes: number;
  recapCapMinutes: number;
  passScore: number;
  restWeekdays: number[]; // 0=Sunday, 6=Saturday
  reviewWeekday: number;
  planGenHour: number;
}

export interface PlanItemInput {
  id: string;
  topicId: string;
  topicTitle: string;
  type: PlanItemType;
  plannedMinutes: number;
  actualMinutes?: number;
  status: PlanItemStatus;
  carriedFromDate?: string;
  orderIndex: number;
}

export interface TopicItemInput {
  id: string;
  title: string;
  description?: string;
  chapter?: string;
  orderIndex: number;
  estimatedMinutes: number;
  status: TopicStatus;
  masteryScore?: number;
  masteryLevel?: MasteryLevel;
  depthGuide?: string;
  realWorldKnowledge?: string[];
  keyInterviewQuestions?: string[];
  reviewStep: number;
  lapses: number;
  lastStudiedAt?: Date | string | null;
  nextReviewAt?: Date | string | null;
  isUrgent?: boolean;
}

export interface TechMarketAnalysis {
  technologyName: string;
  marketDemand: string;
  companyRelevance: string;
  careerImpact: string;
  recommendedDepth: string;
  suggestedRoadmap: "MAIN" | "SECONDARY";
  urgency: UrgencyLevel;
  topics: Array<{
    title: string;
    chapter?: string;
    description: string;
    estimatedMinutes: number;
    depthGuide: string;
    realWorldKnowledge: string[];
    keyInterviewQuestions: string[];
  }>;
}
