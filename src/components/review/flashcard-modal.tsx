"use client";

import {
  IconBrain,
  IconChevronRight,
  IconCompass,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ITopic } from "@/lib/models";

interface FlashcardModalProps {
  topics: ITopic[];
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export function FlashcardModal({
  topics,
  isOpen,
  onClose,
  onCompleted,
}: FlashcardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen]);

  if (!isOpen || topics.length === 0) return null;

  const currentTopic = topics[currentIndex];
  if (!currentTopic) return null;

  const handleRate = async (rating: "AGAIN" | "HARD" | "GOOD" | "EASY") => {
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/topics/${currentTopic._id}/flashcard-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit rating");

      toast.success(data.message);

      if (currentIndex + 1 < topics.length) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        toast.success("Drill completed! All cards reviewed.");
        onCompleted();
        onClose();
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion =
    currentTopic.keyInterviewQuestions?.[0] ||
    currentTopic.description ||
    "Explain the core mechanics and trade-offs of this technology.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="w-full max-w-xl bg-card border border-border rounded-3xl p-6 shadow-2xl flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <IconBrain className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Spaced Recall Drill
              </span>
              <span className="text-xs font-bold text-foreground">
                Card {currentIndex + 1} of {topics.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* 3D Interactive Flip Card */}
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setIsFlipped(!isFlipped);
            }
          }}
          className="relative text-left min-h-[260px] p-6 rounded-3xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer bg-muted/20 hover:bg-muted/30 transition-all flex flex-col justify-between select-none"
        >
          {/* Card Meta */}
          <div className="flex items-center justify-between text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
              {currentTopic.chapter || "Core Foundations"}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <IconRefresh className="h-3 w-3" />
              <span>
                {isFlipped ? "Showing Answer" : "Tap to reveal answer"}
              </span>
            </span>
          </div>

          {/* Card Content (Front vs Back) */}
          {!isFlipped ? (
            <div className="my-auto space-y-3 py-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Recall Challenge:
              </span>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {currentTopic.title}
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                "{currentQuestion}"
              </p>
            </div>
          ) : (
            <div className="my-auto space-y-3 py-2 animate-in fade-in-50 duration-150">
              {currentTopic.depthGuide && (
                <div className="space-y-1">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                    <IconCompass className="h-3.5 w-3.5" />
                    <span>Depth to Master:</span>
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentTopic.depthGuide}
                  </p>
                </div>
              )}

              {currentTopic.realWorldKnowledge &&
                currentTopic.realWorldKnowledge.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-border">
                    <span className="text-[11px] font-bold text-foreground">
                      Real-World Implementation:
                    </span>
                    <ul className="text-xs text-muted-foreground pl-4 list-disc space-y-0.5">
                      {currentTopic.realWorldKnowledge.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {/* Bottom Flip Hint */}
          <div className="text-center pt-2 text-[10px] text-muted-foreground font-semibold">
            {isFlipped
              ? "Rate your memory below ↓"
              : "Spacebar or Click card to flip"}
          </div>
        </button>

        {/* Rating Action Buttons */}
        {isFlipped ? (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block text-center">
              How easily did you recall this?
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleRate("AGAIN")}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 font-bold text-xs transition-all disabled:opacity-50"
              >
                <span>Again</span>
                <span className="text-[10px] font-normal opacity-80">
                  &lt; 1 day
                </span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleRate("HARD")}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 font-bold text-xs transition-all disabled:opacity-50"
              >
                <span>Hard</span>
                <span className="text-[10px] font-normal opacity-80">
                  1-3 days
                </span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleRate("GOOD")}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-teal/10 text-teal border border-teal/20 hover:bg-teal/20 font-bold text-xs transition-all disabled:opacity-50"
              >
                <span>Good</span>
                <span className="text-[10px] font-normal opacity-80">
                  Next Step
                </span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleRate("EASY")}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold text-xs transition-all disabled:opacity-50"
              >
                <span>Easy</span>
                <span className="text-[10px] font-normal opacity-80">
                  +2 Steps
                </span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Reveal Answer</span>
            <IconChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
