"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCircleDot,
  IconEdit,
  IconNotes,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import type { ConceptEvaluation, GradingResult } from "@/core/types";

interface FeedbackCardProps {
  score: number;
  passed: boolean;
  capped?: boolean;
  capReason?: string;
  feedback: GradingResult;
  modelAnswer: string;
  onOpenOverride: () => void;
  onAddToNotes: (content: string) => void;
  onNextQuestion: () => void;
  hasNextQuestion: boolean;
}

export function FeedbackCard({
  score,
  passed,
  capped,
  capReason,
  feedback,
  modelAnswer,
  onOpenOverride,
  onAddToNotes,
  onNextQuestion,
  hasNextQuestion,
}: FeedbackCardProps) {
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  const getCoverageIcon = (coverage: ConceptEvaluation["coverage"]) => {
    switch (coverage) {
      case "full":
        return <IconCheck className="h-4 w-4 text-success shrink-0" />;
      case "partial":
        return <IconCircleDot className="h-4 w-4 text-warning shrink-0" />;
      case "missing":
        return <IconX className="h-4 w-4 text-destructive shrink-0" />;
    }
  };

  const handleNotesExport = () => {
    const text = `### Quiz Reflection (${passed ? "Passed" : "Needs Recap"} - ${score}%)\n\n**Key Improvements:**\n${feedback.improvements.map((i) => `- ${i}`).join("\n")}\n\n**Model Answer Reference:**\n${modelAnswer}`;
    onAddToNotes(text);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Score Banner */}
      <div
        className={`flex items-center justify-between p-5 rounded-2xl border ${
          passed
            ? "bg-success-soft border-success/30 text-success"
            : "bg-primary-soft border-primary/30 text-primary-soft-foreground"
        }`}
      >
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {passed ? "Evaluation Passed" : "Recap Scheduled"}
          </span>
          <span className="text-3xl font-extrabold tracking-tight mt-0.5">
            {score}%
          </span>
          {capped && (
            <span className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
              <IconAlertCircle className="h-3.5 w-3.5" />
              {capReason || "Score capped due to missing essential concept."}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenOverride}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-current text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <IconEdit className="h-3.5 w-3.5" />
          <span>Override</span>
        </button>
      </div>

      {/* Rubric Concept Checklist */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Concept Checklist & Evidence
        </h4>
        <div className="space-y-2">
          {feedback.conceptResults.map((c) => (
            <div
              key={c.concept}
              className="p-3.5 rounded-2xl border border-border bg-card flex flex-col gap-1.5"
            >
              <div className="flex items-start gap-2.5">
                {getCoverageIcon(c.coverage)}
                <div className="flex-1">
                  <span className="text-xs font-semibold text-foreground">
                    {c.concept}
                  </span>
                  <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded capitalize font-medium text-muted-foreground bg-muted">
                    {c.coverage}
                  </span>
                </div>
              </div>

              {c.evidence ? (
                <blockquote className="text-xs text-muted-foreground italic pl-6 border-l-2 border-primary/30 py-0.5">
                  "{c.evidence}"
                </blockquote>
              ) : (
                <span className="text-[11px] text-muted-foreground/70 pl-6">
                  Not mentioned in your answer
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {feedback.strengths?.length > 0 && (
          <div className="p-3.5 rounded-2xl border border-success/20 bg-success-soft/30">
            <h5 className="text-xs font-bold text-success flex items-center gap-1.5 mb-1.5">
              <IconSparkles className="h-3.5 w-3.5" />
              <span>Strengths</span>
            </h5>
            <ul className="text-xs text-foreground/80 space-y-1">
              {feedback.strengths.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {feedback.improvements?.length > 0 && (
          <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary-soft/30">
            <h5 className="text-xs font-bold text-primary-soft-foreground flex items-center gap-1.5 mb-1.5">
              <IconAlertCircle className="h-3.5 w-3.5" />
              <span>Improvements</span>
            </h5>
            <ul className="text-xs text-foreground/80 space-y-1">
              {feedback.improvements.map((imp) => (
                <li key={imp}>• {imp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Foldable Model Answer */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        <button
          type="button"
          onClick={() => setShowModelAnswer(!showModelAnswer)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-foreground hover:bg-muted/50 transition-colors"
        >
          <span>Model Answer (Reference)</span>
          {showModelAnswer ? (
            <IconChevronUp className="h-4 w-4" />
          ) : (
            <IconChevronDown className="h-4 w-4" />
          )}
        </button>

        {showModelAnswer && (
          <div className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/60">
            {modelAnswer}
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleNotesExport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <IconNotes className="h-3.5 w-3.5" />
          <span>Add to Notes</span>
        </button>

        <button
          type="button"
          onClick={onNextQuestion}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <span>{hasNextQuestion ? "Next Question →" : "Finish Quiz"}</span>
        </button>
      </div>
    </div>
  );
}
