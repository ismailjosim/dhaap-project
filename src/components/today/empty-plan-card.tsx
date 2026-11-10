import {
  IconCoffee,
  IconConfetti,
  IconPlus,
  IconRoad,
} from "@tabler/icons-react";
import Link from "next/link";

interface EmptyPlanCardProps {
  isRestDay?: boolean;
  hasRoadmap?: boolean;
  allDone?: boolean;
}

export function EmptyPlanCard({
  isRestDay,
  hasRoadmap = true,
  allDone,
}: EmptyPlanCardProps) {
  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border border-border rounded-3xl shadow-xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success mb-4">
          <IconConfetti className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          All Goals Crushed Today!
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          You've completed every planned topic and quiz for today. Take some
          rest, or review your notes for deeper retention.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link
            href="/roadmap"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <IconRoad className="h-4 w-4" />
            <span>Explore Roadmap</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isRestDay) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border border-border rounded-3xl shadow-xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
          <IconCoffee className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          Scheduled Rest Day
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Taking regular breaks is part of deliberate mastery. Your plan is
          paused for today without backlog pressure.
        </p>
        <Link
          href="/roadmap"
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors"
        >
          <span>Browse Topics</span>
        </Link>
      </div>
    );
  }

  if (!hasRoadmap) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border border-border rounded-3xl shadow-xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-4">
          <IconRoad className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          No Active Roadmap
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Define your learning goal (e.g., "Senior Software Engineer" or "System
          Design Mastery") and let AI generate your structured curriculum.
        </p>
        <Link
          href="/roadmap"
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <IconPlus className="h-4 w-4" />
          <span>Create My First Roadmap</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-2xl">
      <p className="text-xs text-muted-foreground">
        No items currently planned for today.
      </p>
      <Link
        href="/roadmap"
        className="mt-3 text-xs font-semibold text-link hover:underline"
      >
        Go to Roadmap →
      </Link>
    </div>
  );
}
