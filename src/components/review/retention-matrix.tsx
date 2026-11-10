"use client";

import { IconBrain, IconFlame } from "@tabler/icons-react";
import { useMemo } from "react";
import type { IAttempt, ITopic } from "@/lib/models";

interface RetentionMatrixProps {
  topics: ITopic[];
  recentAttempts: IAttempt[];
}

export function RetentionMatrix({
  topics,
  recentAttempts,
}: RetentionMatrixProps) {
  // 1. Spaced Repetition Step Buckets (Steps 1 to 6)
  const stepBuckets = useMemo(() => {
    const buckets = [
      {
        step: 1,
        label: "Day 1 (Intro)",
        interval: "1d",
        count: 0,
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      },
      {
        step: 2,
        label: "Step 2",
        interval: "3d",
        count: 0,
        color:
          "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      },
      {
        step: 3,
        label: "Step 3",
        interval: "7d",
        count: 0,
        color:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      },
      {
        step: 4,
        label: "Step 4",
        interval: "14d",
        count: 0,
        color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      },
      {
        step: 5,
        label: "Step 5",
        interval: "30d",
        count: 0,
        color:
          "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
      },
      {
        step: 6,
        label: "Mastered",
        interval: "60d+",
        count: 0,
        color:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      },
    ];

    for (const t of topics) {
      const stepIdx = Math.min(6, Math.max(1, t.reviewStep || 1)) - 1;
      buckets[stepIdx].count += 1;
    }

    return buckets;
  }, [topics]);

  // 2. Compute 60-day Activity Grid & Streak
  const { activityGrid, streakCount } = useMemo(() => {
    const days: Array<{ date: string; count: number }> = [];
    const countsByDate: Record<string, number> = {};

    for (const a of recentAttempts) {
      const d = new Date(a.createdAt).toISOString().split("T")[0];
      countsByDate[d] = (countsByDate[d] || 0) + 1;
    }

    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const target = new Date();
      target.setDate(today.getDate() - i);
      const key = target.toISOString().split("T")[0];
      days.push({
        date: key,
        count: countsByDate[key] || 0,
      });
    }

    // Compute active streak backwards from today
    let streak = 0;
    const startIndex =
      days[days.length - 1]?.count > 0 ? days.length - 1 : days.length - 2;

    for (let i = startIndex; i >= 0; i--) {
      if (days[i]?.count > 0) {
        streak++;
      } else {
        break;
      }
    }

    return { activityGrid: days, streakCount: streak };
  }, [recentAttempts]);

  const getActivityColor = (count: number) => {
    if (count === 0) return "bg-muted/40 border-border/40";
    if (count === 1) return "bg-primary/30 border-primary/40";
    if (count === 2) return "bg-primary/60 border-primary/70";
    return "bg-primary text-primary-foreground border-primary font-bold";
  };

  return (
    <div className="space-y-6">
      {/* Retention Memory Pipeline */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <IconBrain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Spaced Repetition Memory Pipeline
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Distribution of engineering topics across consolidation stages
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-muted-foreground">
            Total Topics Tracked:{" "}
            <strong className="text-foreground">{topics.length}</strong>
          </span>
        </div>

        {/* 6 Stage Meter */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
          {stepBuckets.map((b) => (
            <div
              key={b.step}
              className={`p-3 rounded-2xl border text-center transition-all ${b.color}`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-80">
                <span>{b.label}</span>
                <span>{b.interval}</span>
              </div>
              <span className="text-2xl font-black block mt-1">{b.count}</span>
              <span className="text-[10px] opacity-75">
                {b.count === 1 ? "1 topic" : `${b.count} topics`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 60-Day Consistency Heatmap */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <IconFlame className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Consistency & Recall Velocity
              </h3>
              <p className="text-[11px] text-muted-foreground">
                60-day visual activity and quiz validation history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-bold">
            <IconFlame className="h-3.5 w-3.5" />
            <span>{streakCount} Day Streak</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="pt-2">
          <div className="flex flex-wrap gap-1.5 justify-start">
            {activityGrid.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} recall attempts`}
                className={`h-4 w-4 rounded-md border transition-all ${getActivityColor(
                  day.count,
                )}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 text-[10px] text-muted-foreground">
            <span>60 Days Ago</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded bg-muted/40 border border-border" />
              <div className="h-2.5 w-2.5 rounded bg-primary/30 border border-primary/40" />
              <div className="h-2.5 w-2.5 rounded bg-primary/60 border border-primary/70" />
              <div className="h-2.5 w-2.5 rounded bg-primary border border-primary" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
