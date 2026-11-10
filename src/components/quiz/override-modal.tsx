"use client";

import { IconCheck, IconLoader, IconX } from "@tabler/icons-react";
import { useState } from "react";
import type { ConceptEvaluation } from "@/core/types";

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  conceptResults: ConceptEvaluation[];
  onSave: (updated: ConceptEvaluation[]) => Promise<void>;
}

export function OverrideModal({
  isOpen,
  onClose,
  conceptResults,
  onSave,
}: OverrideModalProps) {
  const [evals, setEvals] = useState<ConceptEvaluation[]>(conceptResults);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleCoverageChange = (
    index: number,
    coverage: "full" | "partial" | "missing",
  ) => {
    const updated = [...evals];
    updated[index] = { ...updated[index], coverage };
    setEvals(updated);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(evals);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Override Grading
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adjust concept coverage if you think the AI misjudged your answer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {evals.map((item, idx) => (
            <div
              key={item.concept}
              className="p-3.5 rounded-2xl border border-border/80 bg-muted/20"
            >
              <span className="text-xs font-semibold text-foreground block mb-2">
                {idx + 1}. {item.concept}
              </span>

              <div className="flex gap-2">
                {(["full", "partial", "missing"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleCoverageChange(idx, opt)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border capitalize transition-all ${
                      item.coverage === opt
                        ? opt === "full"
                          ? "bg-success-soft text-success border-success"
                          : opt === "partial"
                            ? "bg-warning-soft text-warning border-warning"
                            : "bg-destructive-soft text-destructive-soft-foreground border-destructive"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <IconLoader className="h-4 w-4 animate-spin" />
            ) : (
              <IconCheck className="h-4 w-4" />
            )}
            <span>Recalculate Score</span>
          </button>
        </div>
      </div>
    </div>
  );
}
