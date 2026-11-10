"use client";

import {
  IconCheck,
  IconClock,
  IconFlame,
  IconHistory,
  IconNotes,
  IconSparkles,
} from "@tabler/icons-react";
import type { IPlanItem } from "@/lib/models";

interface PlanItemCardProps {
  item: IPlanItem;
  onToggleStatus: (item: IPlanItem) => void;
  onTakeQuiz: (item: IPlanItem) => void;
  onOpenNotes: (topicId: string, topicTitle: string) => void;
}

export function PlanItemCard({
  item,
  onToggleStatus,
  onTakeQuiz,
  onOpenNotes,
}: PlanItemCardProps) {
  const isDone = item.status === "DONE";

  const typeConfig = {
    RECAP: {
      label: "Recap",
      color: "bg-primary-soft text-primary-soft-foreground border-primary/20",
      icon: IconHistory,
    },
    REVIEW: {
      label: "Spaced Review",
      color: "bg-teal-soft text-teal border-teal/20",
      icon: IconSparkles,
    },
    LEARN: {
      label: "Learn",
      color: "bg-info-soft text-info border-info/20",
      icon: IconFlame,
    },
  }[item.type];

  const TypeIcon = typeConfig.icon;

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
        isDone
          ? "bg-card/50 border-border/50 opacity-70"
          : "bg-card border-border hover:border-primary/40 hover:shadow-xs"
      }`}
    >
      <div className="flex items-start gap-3.5 mb-3 sm:mb-0">
        {/* Toggle Checkbox */}
        <button
          type="button"
          onClick={() => onToggleStatus(item)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border mt-0.5 transition-colors ${
            isDone
              ? "bg-success border-success text-white"
              : "border-border hover:border-primary hover:bg-muted"
          }`}
          title={isDone ? "Mark incomplete" : "Mark done"}
        >
          {isDone && <IconCheck className="h-4 w-4" />}
        </button>

        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeConfig.color}`}
            >
              <TypeIcon className="h-3 w-3" />
              <span>{typeConfig.label}</span>
            </span>

            {/* Carry-over badge */}
            {item.carriedFromDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <IconHistory className="h-2.5 w-2.5" />
                <span>Yesterday's Carry-over</span>
              </span>
            )}

            {/* Estimated Minutes */}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
              <IconClock className="h-3 w-3" />
              <span>{item.plannedMinutes} min</span>
            </span>
          </div>

          <h4
            className={`text-base font-semibold tracking-tight transition-colors ${
              isDone ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {item.topicTitle}
          </h4>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-center pl-9 sm:pl-0">
        <button
          type="button"
          onClick={() => onOpenNotes(item.topicId, item.topicTitle)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Open Notes"
        >
          <IconNotes className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Notes</span>
        </button>

        <button
          type="button"
          onClick={() => onTakeQuiz(item)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shadow-xs ${
            isDone
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <span>{isDone ? "Retake Quiz" : "Take Quiz"}</span>
        </button>
      </div>
    </div>
  );
}
