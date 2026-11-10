import mongoose, { type Document, type Model, Schema } from "mongoose";
import type {
  GradingResult,
  PlanItemStatus,
  PlanItemType,
  RubricConcept,
  TopicStatus,
} from "@/core/types";

// 1. UserSettings
export interface IUserSettings extends Document {
  userId: string;
  timezone: string;
  dailyCapMinutes: number;
  recapCapMinutes: number;
  passScore: number;
  restWeekdays: number[];
  reviewWeekday: number;
  planGenHour: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    timezone: { type: String, default: "Asia/Dhaka" },
    dailyCapMinutes: { type: Number, default: 240 },
    recapCapMinutes: { type: Number, default: 30 },
    passScore: { type: Number, default: 70 },
    restWeekdays: { type: [Number], default: [] },
    reviewWeekday: { type: Number, default: 5 }, // Friday
    planGenHour: { type: Number, default: 23 },
  },
  { timestamps: true },
);

// 2. Roadmap
export interface IRoadmap extends Document {
  userId: string;
  title: string;
  goal: string;
  roadmapType: "MAIN" | "SECONDARY";
  durationMonths?: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  expectedStartDate?: string;
  marketAnalysis?: Record<string, unknown>;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    goal: { type: String, required: true },
    roadmapType: {
      type: String,
      enum: ["MAIN", "SECONDARY"],
      default: "MAIN",
      index: true,
    },
    durationMonths: { type: Number, default: 6 },
    urgency: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },
    expectedStartDate: { type: String },
    marketAnalysis: { type: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// 3. Topic
export interface ITopic extends Document {
  roadmapId: mongoose.Types.ObjectId;
  userId: string;
  title: string;
  chapter?: string;
  description?: string;
  orderIndex: number;
  estimatedMinutes: number;
  status: TopicStatus;
  masteryScore?: number;
  masteryLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  depthGuide?: string;
  realWorldKnowledge?: string[];
  keyInterviewQuestions?: string[];
  reviewStep: number;
  lapses: number;
  lastStudiedAt?: Date;
  nextReviewAt?: Date;
  isUrgent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    roadmapId: {
      type: Schema.Types.ObjectId,
      ref: "Roadmap",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    chapter: { type: String, default: "Core Fundamentals" },
    description: { type: String },
    orderIndex: { type: Number, required: true },
    estimatedMinutes: { type: Number, default: 90 },
    status: {
      type: String,
      enum: [
        "NOT_STARTED",
        "LEARNING",
        "QUIZ_PENDING",
        "PASSED",
        "REVIEWING",
        "MASTERED",
        "NEEDS_RECAP",
        "DEFERRED",
      ],
      default: "NOT_STARTED",
      index: true,
    },
    masteryScore: { type: Number },
    masteryLevel: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
      default: "BEGINNER",
    },
    depthGuide: { type: String },
    realWorldKnowledge: { type: [String], default: [] },
    keyInterviewQuestions: { type: [String], default: [] },
    reviewStep: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    lastStudiedAt: { type: Date },
    nextReviewAt: { type: Date, index: true },
    isUrgent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

TopicSchema.index({ roadmapId: 1, orderIndex: 1 });
TopicSchema.index({ status: 1, nextReviewAt: 1 });

// 4. Question
export interface IQuestion extends Document {
  topicId: mongoose.Types.ObjectId;
  text: string;
  difficulty: number;
  rubric: RubricConcept[];
  modelAnswer: string;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    text: { type: String, required: true },
    difficulty: { type: Number, default: 2 },
    rubric: { type: Schema.Types.Mixed, required: true },
    modelAnswer: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// 5. Attempt
export interface IAttempt extends Document {
  userId: string;
  questionId?: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  answerText?: string;
  transcript?: string;
  audioUrl?: string;
  inputMode: "text" | "voice" | "flashcard";
  score: number;
  overriddenScore?: number;
  passed: boolean;
  feedback?: GradingResult;
  createdAt: Date;
}

const AttemptSchema = new Schema<IAttempt>(
  {
    userId: { type: String, required: true, index: true },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    answerText: { type: String, default: "" },
    transcript: { type: String },
    audioUrl: { type: String },
    inputMode: { type: String, default: "text" },
    score: { type: Number, required: true },
    overriddenScore: { type: Number },
    passed: { type: Boolean, required: true },
    feedback: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AttemptSchema.index({ topicId: 1, createdAt: -1 });

// 6. DayPlan
export interface IPlanItem {
  _id?: mongoose.Types.ObjectId;
  topicId: string;
  topicTitle: string;
  type: PlanItemType;
  plannedMinutes: number;
  actualMinutes?: number;
  status: PlanItemStatus;
  carriedFromDate?: string;
  orderIndex: number;
}

export interface IDayPlan extends Document {
  userId: string;
  date: string; // YYYY-MM-DD
  isRestDay: boolean;
  items: IPlanItem[];
  generatedAt: Date;
}

const PlanItemSchema = new Schema<IPlanItem>({
  topicId: { type: String, required: true },
  topicTitle: { type: String, required: true },
  type: { type: String, enum: ["LEARN", "RECAP", "REVIEW"], required: true },
  plannedMinutes: { type: Number, required: true },
  actualMinutes: { type: Number },
  status: {
    type: String,
    enum: ["PLANNED", "DONE", "SKIPPED"],
    default: "PLANNED",
  },
  carriedFromDate: { type: String },
  orderIndex: { type: Number, required: true },
});

const DayPlanSchema = new Schema<IDayPlan>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    isRestDay: { type: Boolean, default: false },
    items: [PlanItemSchema],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

DayPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

// 7. Note
export interface INote extends Document {
  userId: string;
  topicId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: String, required: true },
    topicId: { type: String, required: true },
    body: { type: String, default: "" },
  },
  { timestamps: true },
);

NoteSchema.index({ userId: 1, topicId: 1 }, { unique: true });

// 8. WeeklyReview
export interface IWeeklyReview extends Document {
  userId: string;
  weekStart: string; // YYYY-MM-DD
  topicIds: string[];
  summary: Record<string, unknown>;
  completedAt?: Date;
  createdAt: Date;
}

const WeeklyReviewSchema = new Schema<IWeeklyReview>(
  {
    userId: { type: String, required: true },
    weekStart: { type: String, required: true },
    topicIds: [{ type: String }],
    summary: { type: Schema.Types.Mixed, default: {} },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

WeeklyReviewSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const UserSettings: Model<IUserSettings> =
  mongoose.models.UserSettings ||
  mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);

export const Roadmap: Model<IRoadmap> =
  mongoose.models.Roadmap || mongoose.model<IRoadmap>("Roadmap", RoadmapSchema);

export const Topic: Model<ITopic> =
  mongoose.models.Topic || mongoose.model<ITopic>("Topic", TopicSchema);

export const Question: Model<IQuestion> =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);

export const Attempt: Model<IAttempt> =
  mongoose.models.Attempt || mongoose.model<IAttempt>("Attempt", AttemptSchema);

export const DayPlan: Model<IDayPlan> =
  mongoose.models.DayPlan || mongoose.model<IDayPlan>("DayPlan", DayPlanSchema);

export const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);

export const WeeklyReview: Model<IWeeklyReview> =
  mongoose.models.WeeklyReview ||
  mongoose.model<IWeeklyReview>("WeeklyReview", WeeklyReviewSchema);

// 9. AICache (TTL-backed intelligent cache for instant AI responses & cost reduction)
export interface IAICache extends Document {
  cacheKey: string;
  cacheType: "TECH_ANALYSIS" | "TOPIC_QUESTIONS" | "GENERAL";
  data: Record<string, unknown>;
  hitCount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AICacheSchema = new Schema<IAICache>(
  {
    cacheKey: { type: String, required: true, unique: true, index: true },
    cacheType: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    hitCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// MongoDB Native TTL index: Automatically deletes document after expiresAt
AICacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AICache: Model<IAICache> =
  mongoose.models.AICache || mongoose.model<IAICache>("AICache", AICacheSchema);
