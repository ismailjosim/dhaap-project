"use client";

import {
  IconCircleCheck,
  IconCompass,
  IconHelpCircle,
  IconHistory,
  IconNotes,
  IconPlayerPause,
  IconPlayerPlay,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { IAttempt, ITopic } from "@/lib/models";
import { StatusBadge } from "../common/status-badge";

interface TopicDetailsDrawerProps {
  topic: ITopic | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuiz: (topic: ITopic) => void;
  onUpdated?: () => void;
}

export function TopicDetailsDrawer({
  topic,
  isOpen,
  onClose,
  onOpenQuiz,
  onUpdated,
}: TopicDetailsDrawerProps) {
  const [attempts, setAttempts] = useState<IAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !topic) return;

    async function loadDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/topics/${topic?._id}`);
        const data = await res.json();
        if (data.attempts) {
          setAttempts(data.attempts);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [isOpen, topic]);

  if (!isOpen || !topic) return null;

  const handleToggleDefer = async () => {
    setActionLoading(true);
    try {
      const newStatus =
        topic.status === "DEFERRED" ? "NOT_STARTED" : "DEFERRED";
      const res = await fetch(`/api/topics/${topic._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(
        newStatus === "DEFERRED"
          ? "Topic deferred from active schedule"
          : "Topic reactivated!",
      );
      onUpdated?.();
      onClose();
    } catch {
      toast.error("Failed to change topic status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to remove "${topic.title}" from this roadmap?`,
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/topics/${topic._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete topic");
      toast.success("Topic removed");
      onUpdated?.();
      onClose();
    } catch {
      toast.error("Failed to delete topic");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-card border-l border-border p-6 shadow-2xl flex flex-col overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <StatusBadge status={topic.status} />
            {topic.chapter && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {topic.chapter}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="py-5 space-y-5 flex-1">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {topic.title}
            </h3>
            {topic.description && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {topic.description}
              </p>
            )}
          </div>

          {/* Depth to Master Guide */}
          {topic.depthGuide && (
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <IconCompass className="h-4 w-4" />
                <span>Depth to Master & Practice:</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {topic.depthGuide}
              </p>
            </div>
          )}

          {/* Real World Knowledge Checklist */}
          {topic.realWorldKnowledge && topic.realWorldKnowledge.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <IconCircleCheck className="h-4 w-4 text-success" />
                <span>Real-World Implementation Checklist:</span>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-xs text-muted-foreground">
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
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <IconHelpCircle className="h-4 w-4 text-primary" />
                  <span>Key Interview Questions to Answer:</span>
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-xs text-muted-foreground">
                  {topic.keyInterviewQuestions.map((q) => (
                    <li key={q} className="leading-snug">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                Estimated Time
              </span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                {topic.estimatedMinutes} min
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                Spaced Interval Step
              </span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                Step {topic.reviewStep} / 6
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                Recall Lapses
              </span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                {topic.lapses}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                Mastery Score & Level
              </span>
              <span className="text-sm font-bold text-foreground block mt-0.5">
                {topic.masteryScore !== undefined && topic.masteryScore !== null
                  ? `${topic.masteryScore}% (${topic.masteryLevel || "ASSESSED"})`
                  : "Not graded"}
              </span>
            </div>
          </div>

          {/* Attempts History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <IconHistory className="h-4 w-4" />
              <span>Interview Quiz History ({attempts.length})</span>
            </h4>

            {loading ? (
              <p className="text-xs text-muted-foreground">
                Loading attempts...
              </p>
            ) : attempts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No quiz attempts yet. Take an AI quiz to validate your recall!
              </p>
            ) : (
              <div className="space-y-2">
                {attempts.map((att) => (
                  <div
                    key={att._id?.toString()}
                    className="p-3 rounded-2xl border border-border bg-card flex items-center justify-between"
                  >
                    <div>
                      <span
                        className={`text-xs font-bold ${
                          att.passed ? "text-success" : "text-destructive"
                        }`}
                      >
                        {att.passed ? "Passed" : "Needs Recap"} (
                        {att.overriddenScore ?? att.score}%)
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {new Date(att.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted font-medium capitalize">
                      {att.inputMode}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Defer and Delete Topic controls */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleToggleDefer}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium disabled:opacity-50"
            >
              {topic.status === "DEFERRED" ? (
                <>
                  <IconPlayerPlay className="h-3.5 w-3.5" />
                  <span>Reactivate Topic</span>
                </>
              ) : (
                <>
                  <IconPlayerPause className="h-3.5 w-3.5" />
                  <span>Defer Topic</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs text-destructive hover:opacity-80 font-medium disabled:opacity-50"
            >
              <IconTrash className="h-3.5 w-3.5" />
              <span>Delete Topic</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex items-center gap-2">
          <a
            href={`/notes?topicId=${topic._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <IconNotes className="h-4 w-4" />
            <span>Open Notes</span>
          </a>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenQuiz(topic);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <IconSparkles className="h-4 w-4" />
            <span>Take Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
}
