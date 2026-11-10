"use client";

import {
  IconBrain,
  IconCalendarEvent,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconClock,
  IconCompass,
  IconHelpCircle,
  IconNotes,
  IconSparkles,
} from "@tabler/icons-react";
import { useState } from "react";
import type { ITopic } from "@/lib/models";
import { StatusBadge } from "../common/status-badge";

interface TopicCardProps {
  topic: ITopic;
  index: number;
  onOpenDetails: (topic: ITopic) => void;
  onOpenQuiz: (topic: ITopic) => void;
}

export function TopicCard({
  topic,
  index,
  onOpenDetails,
  onOpenQuiz,
}: TopicCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getMasteryColor = (level?: string) => {
    switch (level) {
      case "EXPERT":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "ADVANCED":
        return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
      case "INTERMEDIATE":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const hasExtraDetails =
    Boolean(topic.depthGuide) ||
    Boolean(topic.realWorldKnowledge?.length) ||
    Boolean(topic.keyInterviewQuestions?.length);

  return (
    <div className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all space-y-3">
      {/* Top Row: Meta & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-muted-foreground mt-0.5">
            {index + 1}
          </span>

          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={topic.status} />

              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <IconClock className="h-3 w-3" />
                <span>{topic.estimatedMinutes} min</span>
              </span>

              {/* AI Mastery Level / Score Badge */}
              {topic.masteryScore !== undefined &&
              topic.masteryScore !== null ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${getMasteryColor(
                    topic.masteryLevel,
                  )}`}
                >
                  <IconBrain className="h-3 w-3" />
                  <span>
                    {topic.masteryLevel || "ASSESSED"}: {topic.masteryScore}%
                  </span>
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-lg border border-border bg-muted/40 text-muted-foreground font-medium">
                  Not Assessed
                </span>
              )}

              {topic.nextReviewAt && (
                <span className="flex items-center gap-1 text-[11px] text-teal font-medium">
                  <IconCalendarEvent className="h-3 w-3" />
                  <span>
                    Due{" "}
                    {new Date(topic.nextReviewAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h4 className="text-base font-semibold tracking-tight text-foreground">
              {topic.title}
            </h4>

            {topic.description && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {topic.description}
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-1">
          {hasExtraDetails && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Toggle depth guide and checklist"
            >
              <span>{expanded ? "Hide Plan" : "Deep Dive"}</span>
              {expanded ? (
                <IconChevronUp className="h-3.5 w-3.5" />
              ) : (
                <IconChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenDetails(topic)}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Details
          </button>

          <button
            type="button"
            onClick={() => onOpenQuiz(topic)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <IconSparkles className="h-3.5 w-3.5" />
            <span>AI Quiz</span>
          </button>
        </div>
      </div>

      {/* Collapsible Deep Dive Panel */}
      {expanded && hasExtraDetails && (
        <div className="pt-3 border-t border-border/70 space-y-3 animate-in fade-in-50 duration-200">
          {/* Depth to Master */}
          {topic.depthGuide && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
                <IconCompass className="h-3.5 w-3.5" />
                <span>Depth to Master & Practice:</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {topic.depthGuide}
              </p>
            </div>
          )}

          {/* Real World Knowledge & Interview Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Real World Implementation */}
            {topic.realWorldKnowledge &&
              topic.realWorldKnowledge.length > 0 && (
                <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <IconCircleCheck className="h-3.5 w-3.5 text-success" />
                    <span>Real-World Implementation:</span>
                  </div>
                  <ul className="space-y-1 pl-4 list-disc text-muted-foreground">
                    {topic.realWorldKnowledge.map((item) => (
                      <li key={item} className="leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Key Interview Questions */}
            {topic.keyInterviewQuestions &&
              topic.keyInterviewQuestions.length > 0 && (
                <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <IconHelpCircle className="h-3.5 w-3.5 text-primary" />
                    <span>Key Interview Questions:</span>
                  </div>
                  <ul className="space-y-1 pl-4 list-disc text-muted-foreground">
                    {topic.keyInterviewQuestions.map((q) => (
                      <li key={q} className="leading-snug">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          <div className="flex justify-end pt-1">
            <a
              href={`/notes?topicId=${topic._id}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
            >
              <IconNotes className="h-3.5 w-3.5" />
              <span>Open Study Notes for this Topic &rarr;</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
