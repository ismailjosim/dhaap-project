"use client";

import {
  IconArrowRight,
  IconBriefcase,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconCompass,
  IconFlame,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import type { IRoadmap, ITopic } from "@/lib/models";

export interface SecondaryRoadmapWithMeta extends IRoadmap {
  topicCount?: number;
  sampleTopics?: ITopic[];
}

interface SecondaryRoadmapCardProps {
  roadmap: SecondaryRoadmapWithMeta;
  onPromoted: () => void;
  onDeleted: () => void;
}

interface MarketAnalysisData {
  marketDemand?: string;
  companyRelevance?: string;
  careerImpact?: string;
  recommendedDepth?: string;
}

export function SecondaryRoadmapCard({
  roadmap,
  onPromoted,
  onDeleted,
}: SecondaryRoadmapCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const analysis = roadmap.marketAnalysis as MarketAnalysisData | undefined;

  const handlePromote = async (action: "SET_AS_ACTIVE" | "APPEND_TO_MAIN") => {
    setPromoting(true);
    try {
      const res = await fetch("/api/roadmaps/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secondaryRoadmapId: roadmap._id,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Promotion failed");

      toast.success(data.message || "Roadmap promoted successfully!");
      onPromoted();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPromoting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Remove "${roadmap.title}" from your Secondary Radar? This will delete its analyzed curriculum.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/roadmaps/${roadmap._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete secondary roadmap");

      toast.success(`Removed "${roadmap.title}"`);
      onDeleted();
    } catch {
      toast.error("Failed to delete roadmap");
    } finally {
      setDeleting(false);
    }
  };

  const urgencyStyles = {
    HIGH: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    MEDIUM:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    LOW: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  }[roadmap.urgency || "MEDIUM"];

  return (
    <div className="p-5 rounded-3xl border border-border bg-card shadow-xs hover:border-primary/40 transition-all space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase ${urgencyStyles}`}
            >
              {roadmap.urgency || "MEDIUM"} Urgency
            </span>

            {roadmap.expectedStartDate && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <IconCalendar className="h-3.5 w-3.5 text-primary" />
                <span>Expected: {roadmap.expectedStartDate}</span>
              </span>
            )}

            <span className="text-[11px] text-muted-foreground font-medium">
              • {roadmap.topicCount ?? 0} topics in curriculum
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-foreground">
            {roadmap.title}
          </h3>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            {roadmap.goal}
          </p>
        </div>

        {/* Delete button */}
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="self-end sm:self-start p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete from radar"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>

      {/* Market Analysis Insights */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border text-xs">
          <div className="space-y-1">
            <span className="flex items-center gap-1 font-bold text-foreground">
              <IconFlame className="h-3.5 w-3.5 text-primary" />
              <span>Market Demand</span>
            </span>
            <p className="text-muted-foreground leading-snug">
              {analysis.marketDemand}
            </p>
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1 font-bold text-foreground">
              <IconBriefcase className="h-3.5 w-3.5 text-success" />
              <span>Company Relevance</span>
            </span>
            <p className="text-muted-foreground leading-snug">
              {analysis.companyRelevance}
            </p>
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-1 font-bold text-foreground">
              <IconCompass className="h-3.5 w-3.5 text-teal" />
              <span>Recommended Depth</span>
            </span>
            <p className="text-muted-foreground leading-snug">
              {analysis.recommendedDepth}
            </p>
          </div>
        </div>
      )}

      {/* Topics Preview Accordion */}
      {roadmap.sampleTopics && roadmap.sampleTopics.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>
              {expanded
                ? "Hide curriculum outline"
                : "Preview curriculum outline"}
            </span>
            {expanded ? (
              <IconChevronUp className="h-3.5 w-3.5" />
            ) : (
              <IconChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {expanded && (
            <div className="mt-2.5 space-y-2 pt-2 border-t border-border">
              {roadmap.sampleTopics.map((t, idx) => (
                <div
                  key={t._id?.toString() || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-foreground">
                      {t.title}
                    </span>
                    {t.chapter && (
                      <span className="text-[10px] text-muted-foreground">
                        ({t.chapter})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {t.estimatedMinutes} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Promotion Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Ready to focus on this technology?
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={promoting}
            onClick={() => handlePromote("APPEND_TO_MAIN")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <IconPlus className="h-3.5 w-3.5" />
            <span>Append to Current Main</span>
          </button>

          <button
            type="button"
            disabled={promoting}
            onClick={() => handlePromote("SET_AS_ACTIVE")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs disabled:opacity-50"
          >
            <IconArrowRight className="h-3.5 w-3.5" />
            <span>Make Active Main Roadmap</span>
          </button>
        </div>
      </div>
    </div>
  );
}
