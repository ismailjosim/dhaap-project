"use client";

import {
  IconAlertTriangle,
  IconCalendar,
  IconFlame,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import type { IPlanItem, IUserSettings } from "@/lib/models";
import { QuizModal } from "../quiz/quiz-modal";
import { EmptyPlanCard } from "./empty-plan-card";
import { PlanItemCard } from "./plan-item-card";
import { StatRing } from "./stat-ring";

export interface SerializedDayPlan {
  _id?: string;
  userId: string;
  date: string;
  isRestDay: boolean;
  items: IPlanItem[];
  generatedAt?: string | Date;
}

interface TodayViewProps {
  initialPlan: SerializedDayPlan | null;
  settings: IUserSettings;
  todayDateStr: string;
  hasRoadmap: boolean;
}

export function TodayView({
  initialPlan,
  settings: _settings,
  todayDateStr,
  hasRoadmap,
}: TodayViewProps) {
  const [plan, setPlan] = useState<SerializedDayPlan | null>(initialPlan);
  const [regenerating, setRegenerating] = useState(false);
  const [activeQuizTopic, setActiveQuizTopic] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const reloadPlan = async () => {
    try {
      const res = await fetch("/api/plan/today");
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
      }
    } catch {
      toast.error("Failed to refresh day plan");
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/plan/today", { method: "POST" });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        toast.success("Today's plan rebalanced!");
      }
    } catch {
      toast.error("Failed to regenerate plan");
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleStatus = async (item: IPlanItem) => {
    const nextStatus = item.status === "DONE" ? "PLANNED" : "DONE";

    // Optimistic update
    setPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((i) =>
          i._id === item._id ? { ...i, status: nextStatus } : i,
        ),
      };
    });

    try {
      const res = await fetch(`/api/plan-items/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }
    } catch {
      toast.error("Failed to update status");
      reloadPlan();
    }
  };

  const handleTakeQuiz = (item: IPlanItem) => {
    setActiveQuizTopic({ id: item.topicId, title: item.topicTitle });
  };

  const handleOpenNotes = (topicId: string) => {
    window.location.href = `/notes?topicId=${topicId}`;
  };

  if (!hasRoadmap) {
    return <EmptyPlanCard hasRoadmap={false} />;
  }

  if (plan?.isRestDay) {
    return <EmptyPlanCard isRestDay={true} />;
  }

  const items = plan?.items || [];
  const recapAndReviewItems = items.filter(
    (i) => i.type === "RECAP" || i.type === "REVIEW",
  );
  const learnItems = items.filter((i) => i.type === "LEARN");

  const plannedMinutes = items.reduce((acc, i) => acc + i.plannedMinutes, 0);
  const doneMinutes = items
    .filter((i) => i.status === "DONE")
    .reduce((acc, i) => acc + i.plannedMinutes, 0);

  const carryOverCount = items.filter((i) => Boolean(i.carriedFromDate)).length;
  const allDone = items.length > 0 && items.every((i) => i.status === "DONE");

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <IconCalendar className="h-4 w-4 text-primary" />
            <span>
              {new Date(todayDateStr).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Today's Focused Learning
          </h1>
        </div>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title="Recalculate today's planned items"
        >
          <IconRefresh
            className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`}
          />
          <span>Rebalance Plan</span>
        </button>
      </div>

      {/* Backlog Banner */}
      {carryOverCount >= 3 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
          <IconAlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold block">
              You have {carryOverCount} carry-over topics from previous days.
            </span>
            <span>
              Consider completing them or rebalancing your roadmap to prevent
              backlog accumulation.
            </span>
          </div>
        </div>
      )}

      {/* Progress Budget Ring */}
      <StatRing plannedMinutes={plannedMinutes} doneMinutes={doneMinutes} />

      {allDone && <EmptyPlanCard allDone={true} />}

      {/* Section 1: Recap & Review */}
      {recapAndReviewItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-soft text-primary">
              <IconSparkles className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Recap & Spaced Recall
            </h3>
            <span className="text-[11px] font-medium text-muted-foreground">
              ({recapAndReviewItems.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {recapAndReviewItems.map((item) => (
              <PlanItemCard
                key={item._id?.toString() || item.topicId}
                item={item}
                onToggleStatus={handleToggleStatus}
                onTakeQuiz={handleTakeQuiz}
                onOpenNotes={handleOpenNotes}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Learn */}
      {learnItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-info-soft text-info">
              <IconFlame className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              New Topics
            </h3>
            <span className="text-[11px] font-medium text-muted-foreground">
              ({learnItems.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {learnItems.map((item) => (
              <PlanItemCard
                key={item._id?.toString() || item.topicId}
                item={item}
                onToggleStatus={handleToggleStatus}
                onTakeQuiz={handleTakeQuiz}
                onOpenNotes={handleOpenNotes}
              />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && !plan?.isRestDay && (
        <EmptyPlanCard hasRoadmap={true} />
      )}

      {/* Quiz Modal */}
      {activeQuizTopic && (
        <QuizModal
          topic={activeQuizTopic}
          isOpen={Boolean(activeQuizTopic)}
          onClose={() => setActiveQuizTopic(null)}
          onCompleted={() => {
            reloadPlan();
            toast.success("Topic quiz completed!");
          }}
        />
      )}
    </div>
  );
}
