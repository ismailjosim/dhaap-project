"use client";

import {
  IconBriefcase,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCompass,
  IconFlame,
  IconLoader,
  IconRadar,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import type { TechAnalysisResult } from "@/lib/ai";

interface TechAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoadmapCreated: () => void;
}

export function TechAnalyzerModal({
  isOpen,
  onClose,
  onRoadmapCreated,
}: TechAnalyzerModalProps) {
  const [query, setQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TechAnalysisResult | null>(null);

  // User choice state
  const [destination, setDestination] = useState<"MAIN" | "SECONDARY">("MAIN");
  const [durationMonths, setDurationMonths] = useState(1);
  const [urgency, setUrgency] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [expectedDate, setExpectedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setAnalyzing(true);
    try {
      const res = await fetch("/api/roadmaps/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalysis(data.analysis);
      setDestination(data.analysis.suggestedRoadmap || "MAIN");
      setUrgency(data.analysis.urgency || "MEDIUM");
      toast.success(
        `Market analysis completed for "${data.analysis.technologyName}"!`,
      );
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToRoadmap = async () => {
    if (!analysis) return;

    setSaving(true);
    try {
      const res = await fetch("/api/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: analysis.technologyName,
          goal: `Master ${analysis.technologyName}: ${analysis.careerImpact}`,
          roadmapType: destination,
          durationMonths: destination === "MAIN" ? durationMonths : undefined,
          urgency,
          expectedStartDate:
            destination === "SECONDARY" ? expectedDate : undefined,
          marketAnalysis: {
            marketDemand: analysis.marketDemand,
            companyRelevance: analysis.companyRelevance,
            careerImpact: analysis.careerImpact,
            recommendedDepth: analysis.recommendedDepth,
          },
          topics: analysis.topics,
          setAsActive: destination === "MAIN",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save roadmap");

      toast.success(
        destination === "MAIN"
          ? `Added to your Main Roadmap!`
          : `Saved to Secondary Roadmap queue!`,
      );
      onRoadmapCreated();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Group topics by chapter
  const chapters = analysis?.topics.reduce(
    (acc, t) => {
      const ch = t.chapter || "Core Curriculum";
      if (!acc[ch]) acc[ch] = [];
      acc[ch].push(t);
      return acc;
    },
    {} as Record<string, typeof analysis.topics>,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <IconRadar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Technology Market Radar
              </h3>
              <p className="text-xs text-muted-foreground">
                Analyze new tools & technologies before adding to your roadmaps
              </p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {!analysis ? (
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label
                  htmlFor="tech-query-input"
                  className="block text-xs font-semibold text-foreground/80 mb-1.5"
                >
                  What technology or topic do you want to explore?
                </label>
                <input
                  id="tech-query-input"
                  type="text"
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Docker, Apache Kafka, Rust for Backends, Qdrant Vector DB, Kubernetes"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground block">
                  AI Market Analysis will examine:
                </span>
                <p>• Current real company demand & hiring criteria</p>
                <p>
                  • Career impact: What superpowers and salary boost it brings
                </p>
                <p>
                  • Chapter-by-chapter collapsible syllabus with real-world
                  implementation specs
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={analyzing || !query.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {analyzing ? (
                    <>
                      <IconLoader className="h-4 w-4 animate-spin" />
                      <span>Analyzing Market Demand & Topics...</span>
                    </>
                  ) : (
                    <>
                      <IconSparkles className="h-4 w-4" />
                      <span>Analyze Technology</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Technology Overview */}
              <div className="p-4 rounded-2xl bg-primary-soft/20 border border-primary/30">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">
                    {analysis.technologyName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary text-white">
                    Suggested: {analysis.suggestedRoadmap}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="font-bold text-foreground block mb-0.5 flex items-center gap-1">
                      <IconBriefcase className="h-3.5 w-3.5 text-primary" />
                      <span>Company Demand</span>
                    </span>
                    <p className="text-muted-foreground">
                      {analysis.marketDemand}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="font-bold text-foreground block mb-0.5 flex items-center gap-1">
                      <IconFlame className="h-3.5 w-3.5 text-primary" />
                      <span>Career Impact</span>
                    </span>
                    <p className="text-muted-foreground">
                      {analysis.careerImpact}
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted-foreground px-1">
                  <span className="font-semibold text-foreground">
                    Recommended Depth:
                  </span>{" "}
                  {analysis.recommendedDepth}
                </div>
              </div>

              {/* Collapsible Chapters & Topics */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Curriculum Breakdown ({analysis.topics.length} Topics)
                </span>

                {chapters &&
                  Object.entries(chapters).map(
                    ([chapterName, chapterTopics]) => {
                      const isExpanded =
                        expandedChapter === chapterName ||
                        Object.keys(chapters).length === 1;
                      return (
                        <div
                          key={chapterName}
                          className="border border-border rounded-2xl bg-card overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedChapter(
                                isExpanded ? null : chapterName,
                              )
                            }
                            className="w-full flex items-center justify-between p-3.5 text-left font-bold text-xs text-foreground hover:bg-muted/40 transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <IconCompass className="h-4 w-4 text-primary" />
                              <span>{chapterName}</span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                ({chapterTopics.length} topics)
                              </span>
                            </span>
                            {isExpanded ? (
                              <IconChevronUp className="h-4 w-4" />
                            ) : (
                              <IconChevronDown className="h-4 w-4" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="p-3 pt-0 space-y-2 border-t border-border/50 bg-muted/10">
                              {chapterTopics.map((t) => (
                                <div
                                  key={t.title}
                                  className="p-3 rounded-xl bg-card border border-border/70 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">
                                      {t.title}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                      <IconClock className="h-3 w-3" />
                                      <span>{t.estimatedMinutes}m</span>
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {t.description}
                                  </p>

                                  {t.depthGuide && (
                                    <p className="text-[11px] text-primary-soft-foreground bg-primary-soft/30 p-2 rounded-lg">
                                      <strong>Deep Learning Goal:</strong>{" "}
                                      {t.depthGuide}
                                    </p>
                                  )}

                                  {t.realWorldKnowledge?.length > 0 && (
                                    <div className="text-[11px] text-muted-foreground">
                                      <span className="font-semibold text-foreground">
                                        Real-world Implementation:
                                      </span>
                                      <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                                        {t.realWorldKnowledge.map((rw) => (
                                          <li key={rw}>{rw}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
              </div>

              {/* Decision Section */}
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  Where would you like to add this?
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDestination("MAIN")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      destination === "MAIN"
                        ? "border-primary bg-primary-soft text-primary-soft-foreground font-bold shadow-xs"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs block">
                      Option A: Main Roadmap
                    </span>
                    <span className="text-[10px] font-normal block mt-0.5">
                      Primary focus right now
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDestination("SECONDARY")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      destination === "SECONDARY"
                        ? "border-primary bg-primary-soft text-primary-soft-foreground font-bold shadow-xs"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs block">
                      Option B: Secondary Queue
                    </span>
                    <span className="text-[10px] font-normal block mt-0.5">
                      Future radar with start date
                    </span>
                  </button>
                </div>

                {destination === "MAIN" ? (
                  <div className="flex items-center gap-3 pt-2">
                    <label
                      htmlFor="duration-months"
                      className="text-xs text-muted-foreground"
                    >
                      Focus Duration:
                    </label>
                    <select
                      id="duration-months"
                      value={durationMonths}
                      onChange={(e) =>
                        setDurationMonths(Number(e.target.value))
                      }
                      className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold"
                    >
                      <option value={1}>1 Month Sprint</option>
                      <option value={3}>3 Months Focus</option>
                      <option value={6}>6 Months Comprehensive</option>
                      <option value={12}>12 Months Lifelong Mastery</option>
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label
                        htmlFor="urgency-select"
                        className="block text-[11px] text-muted-foreground mb-1"
                      >
                        Urgency:
                      </label>
                      <select
                        id="urgency-select"
                        value={urgency}
                        onChange={(e) =>
                          setUrgency(
                            e.target.value as "HIGH" | "MEDIUM" | "LOW",
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold"
                      >
                        <option value="HIGH">High (Start soon)</option>
                        <option value="MEDIUM">Medium (Next in line)</option>
                        <option value="LOW">Low (Exploratory radar)</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="expected-start"
                        className="block text-[11px] text-muted-foreground mb-1"
                      >
                        Expected Start Month/Date:
                      </label>
                      <input
                        id="expected-start"
                        type="text"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                        placeholder="e.g. Dec 2026 or Q1 2027"
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAnalysis(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:bg-muted"
                >
                  Analyze Another
                </button>

                <button
                  type="button"
                  onClick={handleSaveToRoadmap}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving ? (
                    <IconLoader className="h-4 w-4 animate-spin" />
                  ) : (
                    <IconCheck className="h-4 w-4" />
                  )}
                  <span>
                    Save to{" "}
                    {destination === "MAIN" ? "Main Focus" : "Secondary Queue"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
