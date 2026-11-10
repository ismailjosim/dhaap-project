"use client";

import {
  IconBrain,
  IconLoader,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ConceptEvaluation, GradingResult } from "@/core/types";
import type { IQuestion } from "@/lib/models";
import { FeedbackCard } from "./feedback-card";
import { OverrideModal } from "./override-modal";
import { VoiceRecorder } from "./voice-recorder";

interface QuizModalProps {
  topic: { id: string; title: string };
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function QuizModal({
  topic,
  isOpen,
  onClose,
  onCompleted,
}: QuizModalProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [latestAttemptId, setLatestAttemptId] = useState<string | null>(null);

  // Result state for current question
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    capped?: boolean;
    capReason?: string;
    feedback: GradingResult;
  } | null>(null);

  const [overrideOpen, setOverrideOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setUserAnswer("");
      setCurrentIndex(0);
      return;
    }

    async function loadQuiz() {
      setLoading(true);
      try {
        const res = await fetch(`/api/topics/${topic.id}/quiz`);
        const data = await res.json();
        if (data.questions) {
          setQuestions(data.questions);
        } else {
          toast.error(data.error || "Failed to load questions");
        }
      } catch {
        toast.error("Network error while generating quiz");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [isOpen, topic.id]);

  if (!isOpen) return null;

  const currentQuestion = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.warning("Please provide an answer before submitting.");
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          questionId: currentQuestion._id,
          answerText: userAnswer,
          inputMode: "text",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      setLatestAttemptId(data.attempt._id);
      setResult({
        score: data.scoreResult.score,
        passed: data.scoreResult.passed,
        capped: data.scoreResult.capped,
        capReason: data.scoreResult.capReason,
        feedback: data.gradingResult,
      });

      toast.success(
        data.scoreResult.passed
          ? "Great job! Topic passed."
          : "Recap scheduled for tomorrow.",
      );
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEvaluating(false);
    }
  };

  const handleOverrideSave = async (updatedConcepts: ConceptEvaluation[]) => {
    if (!latestAttemptId) return;

    try {
      const res = await fetch(`/api/attempts/${latestAttemptId}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptResults: updatedConcepts }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult((prev) =>
          prev
            ? {
                ...prev,
                score: data.score,
                passed: data.passed,
                feedback: {
                  ...prev.feedback,
                  conceptResults: updatedConcepts,
                },
              }
            : null,
        );
        toast.success("Score updated via override");
      }
    } catch {
      toast.error("Failed to update override");
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setResult(null);
    } else {
      onCompleted?.();
      onClose();
    }
  };

  const handleAddToNotes = async (content: string) => {
    try {
      const getRes = await fetch(`/api/topics/${topic.id}/notes`);
      const getData = await getRes.json();
      const existing = getData.note?.body || "";
      const updatedBody = existing ? `${existing}\n\n${content}` : content;

      await fetch(`/api/topics/${topic.id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: updatedBody }),
      });

      toast.success("Saved to topic notes!");
    } catch {
      toast.error("Failed to append to notes");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <IconBrain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                AI Technical Interview
              </h3>
              <p className="text-xs text-muted-foreground">{topic.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <IconLoader className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Generating interview questions & technical rubric...
              </p>
            </div>
          ) : !currentQuestion ? (
            <p className="text-center text-xs text-muted-foreground py-10">
              No questions found for this topic.
            </p>
          ) : result ? (
            <FeedbackCard
              score={result.score}
              passed={result.passed}
              capped={result.capped}
              capReason={result.capReason}
              feedback={result.feedback}
              modelAnswer={currentQuestion.modelAnswer}
              onOpenOverride={() => setOverrideOpen(true)}
              onAddToNotes={handleAddToNotes}
              onNextQuestion={handleNext}
              hasNextQuestion={currentIndex < questions.length - 1}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/50 font-semibold text-muted-foreground">
                  Difficulty {currentQuestion.difficulty}/3
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/80">
                <h4 className="text-base font-semibold text-foreground leading-snug">
                  {currentQuestion.text}
                </h4>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="technical-answer-input"
                    className="block text-xs font-semibold text-foreground/80"
                  >
                    Your Technical Answer
                  </label>
                  <VoiceRecorder
                    onTranscriptionComplete={(text) => {
                      setUserAnswer((prev) =>
                        prev.trim() ? `${prev} ${text}` : text,
                      );
                    }}
                    disabled={evaluating}
                  />
                </div>
                <textarea
                  id="technical-answer-input"
                  rows={6}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Explain your approach, design trade-offs, and how you would solve this..."
                  className="w-full p-4 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={evaluating || !userAnswer.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {evaluating ? (
                    <>
                      <IconLoader className="h-4 w-4 animate-spin" />
                      <span>Grading against Rubric...</span>
                    </>
                  ) : (
                    <>
                      <IconSparkles className="h-4 w-4" />
                      <span>Submit & Evaluate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {result && (
        <OverrideModal
          isOpen={overrideOpen}
          onClose={() => setOverrideOpen(false)}
          conceptResults={result.feedback.conceptResults}
          onSave={handleOverrideSave}
        />
      )}
    </div>
  );
}
