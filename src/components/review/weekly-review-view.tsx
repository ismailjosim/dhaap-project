"use client";

import {
  IconAlertCircle,
  IconCards,
  IconChecklist,
  IconSparkles,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import type { IAttempt, ITopic } from "@/lib/models";
import { StatusBadge } from "../common/status-badge";
import { QuizModal } from "../quiz/quiz-modal";
import { FlashcardModal } from "./flashcard-modal";
import { RetentionMatrix } from "./retention-matrix";

interface WeeklyReviewViewProps {
  summary: {
    totalAttempts: number;
    passedCount: number;
    failedCount: number;
    studiedTopicsCount: number;
    dueReviewsCount: number;
    recapBacklogCount: number;
  };
  studiedTopics: ITopic[];
  dueTopics: ITopic[];
  recapTopics: ITopic[];
  recentAttempts: IAttempt[];
  allTopics?: ITopic[];
  sixtyDayAttempts?: IAttempt[];
}

export function WeeklyReviewView({
  summary,
  studiedTopics,
  dueTopics,
  recapTopics,
  allTopics = [],
  sixtyDayAttempts = [],
}: WeeklyReviewViewProps) {
  const [quizTopic, setQuizTopic] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [flashcardTopics, setFlashcardTopics] = useState<ITopic[] | null>(null);

  const passRate =
    summary.totalAttempts > 0
      ? Math.round((summary.passedCount / summary.totalAttempts) * 100)
      : 100;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <IconChecklist className="h-4 w-4 text-primary" />
            <span>Weekly Synthesis & Retention</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Engineering Retention Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review your 7-day recall trend, solidify weak areas, and drill
            flashcards for memory consolidation.
          </p>
        </div>

        {/* Global Flashcard Drill Action */}
        {(dueTopics.length > 0 || recapTopics.length > 0) && (
          <button
            type="button"
            onClick={() => setFlashcardTopics([...recapTopics, ...dueTopics])}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs self-start sm:self-auto shrink-0"
          >
            <IconCards className="h-4 w-4" />
            <span>
              Start Quick Flashcard Drill (
              {recapTopics.length + dueTopics.length})
            </span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">
            Validation Rate
          </span>
          <span className="text-2xl font-extrabold text-foreground block mt-1">
            {passRate}%
          </span>
          <span className="text-[11px] text-muted-foreground">
            {summary.passedCount} of {summary.totalAttempts} attempts passed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">
            Topics Studied
          </span>
          <span className="text-2xl font-extrabold text-foreground block mt-1">
            {summary.studiedTopicsCount}
          </span>
          <span className="text-[11px] text-muted-foreground">
            in past 7 days
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[10px] font-bold uppercase text-teal">
            Due Spaced Recalls
          </span>
          <span className="text-2xl font-extrabold text-teal block mt-1">
            {summary.dueReviewsCount}
          </span>
          <span className="text-[11px] text-muted-foreground">
            ready for review
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[10px] font-bold uppercase text-primary">
            Recap Backlog
          </span>
          <span className="text-2xl font-extrabold text-primary block mt-1">
            {summary.recapBacklogCount}
          </span>
          <span className="text-[11px] text-muted-foreground">needs recap</span>
        </div>
      </div>

      {/* 60-Day Consistency Heatmap & Memory Pipeline */}
      <RetentionMatrix
        topics={allTopics.length > 0 ? allTopics : studiedTopics}
        recentAttempts={sixtyDayAttempts}
      />

      {/* Recap Backlog Section */}
      {recapTopics.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconAlertCircle className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Needs Recap ({recapTopics.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setFlashcardTopics(recapTopics)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <IconCards className="h-3.5 w-3.5" />
              <span>Drill All Recap Cards</span>
            </button>
          </div>

          <div className="space-y-2">
            {recapTopics.map((topic) => (
              <div
                key={topic._id.toString()}
                className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5"
              >
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {topic.title}
                  </h4>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    {topic.lapses} lapse(s) recorded • {topic.estimatedMinutes}{" "}
                    min
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFlashcardTopics([topic])}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border hover:bg-card transition-all"
                  >
                    <IconCards className="h-3.5 w-3.5" />
                    <span>Flashcard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setQuizTopic({
                        id: topic._id.toString(),
                        title: topic.title,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <IconSparkles className="h-3.5 w-3.5" />
                    <span>Recap Quiz</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Due Reviews Section */}
      {dueTopics.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconSparkles className="h-4 w-4 text-teal" />
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Due for Spaced Review ({dueTopics.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setFlashcardTopics(dueTopics)}
              className="text-xs font-semibold text-teal hover:underline flex items-center gap-1"
            >
              <IconCards className="h-3.5 w-3.5" />
              <span>Drill All Review Cards</span>
            </button>
          </div>

          <div className="space-y-2">
            {dueTopics.map((topic) => (
              <div
                key={topic._id.toString()}
                className="flex items-center justify-between p-4 rounded-2xl border border-teal/20 bg-teal/5"
              >
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {topic.title}
                  </h4>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    Step {topic.reviewStep}/6 • Due now
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFlashcardTopics([topic])}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border hover:bg-card transition-all"
                  >
                    <IconCards className="h-3.5 w-3.5" />
                    <span>Flashcard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setQuizTopic({
                        id: topic._id.toString(),
                        title: topic.title,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <IconSparkles className="h-3.5 w-3.5" />
                    <span>Review Quiz</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Studied Topics */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Topics Practiced This Week ({studiedTopics.length})
        </h3>

        {studiedTopics.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-2xl">
            <p className="text-xs text-muted-foreground">
              No topic attempts logged in the last 7 days. Complete quizzes or
              flashcards from Today or Roadmap to populate this review.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {studiedTopics.map((topic) => (
              <div
                key={topic._id.toString()}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={topic.status} />
                  <span className="text-xs font-semibold text-foreground">
                    {topic.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFlashcardTopics([topic])}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:bg-muted"
                  >
                    Flashcard
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setQuizTopic({
                        id: topic._id.toString(),
                        title: topic.title,
                      })
                    }
                    className="px-3 py-1 rounded-lg text-xs font-medium border border-border hover:bg-muted"
                  >
                    Retest
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Flashcard Drill Modal */}
      {flashcardTopics && (
        <FlashcardModal
          topics={flashcardTopics}
          isOpen={Boolean(flashcardTopics)}
          onClose={() => setFlashcardTopics(null)}
          onCompleted={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Full AI Quiz Modal */}
      {quizTopic && (
        <QuizModal
          topic={quizTopic}
          isOpen={Boolean(quizTopic)}
          onClose={() => setQuizTopic(null)}
          onCompleted={() => {
            toast.success("Review quiz completed!");
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
