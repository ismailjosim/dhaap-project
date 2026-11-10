"use client";

import {
  IconBook,
  IconBrain,
  IconChevronDown,
  IconChevronUp,
  IconCompass,
  IconPlus,
  IconRadar,
  IconRoad,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import type { IRoadmap, ITopic } from "@/lib/models";
import { QuizModal } from "../quiz/quiz-modal";
import { RoadmapGeneratorModal } from "./roadmap-generator-modal";
import {
  SecondaryRoadmapCard,
  type SecondaryRoadmapWithMeta,
} from "./secondary-roadmap-card";
import { TechAnalyzerModal } from "./tech-analyzer-modal";
import { TopicCard } from "./topic-card";
import { TopicDetailsDrawer } from "./topic-details-drawer";

interface RoadmapViewProps {
  initialRoadmap: IRoadmap | null;
  initialTopics: ITopic[];
  allRoadmaps: IRoadmap[];
  initialSecondaryRoadmaps?: SecondaryRoadmapWithMeta[];
}

export function RoadmapView({
  initialRoadmap,
  initialTopics,
  allRoadmaps: _allRoadmaps,
  initialSecondaryRoadmaps = [],
}: RoadmapViewProps) {
  const [activeTab, setActiveTab] = useState<"MAIN" | "SECONDARY">("MAIN");
  const [roadmap, setRoadmap] = useState<IRoadmap | null>(initialRoadmap);
  const [topics, setTopics] = useState<ITopic[]>(initialTopics);
  const [secondaryRoadmaps, setSecondaryRoadmaps] = useState<
    SecondaryRoadmapWithMeta[]
  >(initialSecondaryRoadmaps);

  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ITopic | null>(null);
  const [quizTopic, setQuizTopic] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Collapsible chapter state (defaults to open)
  const [collapsedChapters, setCollapsedChapters] = useState<
    Record<string, boolean>
  >({});

  const reloadData = async () => {
    try {
      const res = await fetch("/api/roadmaps");
      const data = await res.json();
      if (data.activeRoadmap) {
        setRoadmap(data.activeRoadmap);
        setTopics(data.topics || []);
      }
      if (data.secondaryRoadmaps) {
        setSecondaryRoadmaps(data.secondaryRoadmaps);
      }
    } catch {
      toast.error("Failed to refresh roadmap");
    }
  };

  const toggleChapter = (chapterName: string) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapterName]: !prev[chapterName],
    }));
  };

  const toggleAllChapters = (collapse: boolean) => {
    const updated: Record<string, boolean> = {};
    for (const ch of Object.keys(chaptersMap)) {
      updated[ch] = collapse;
    }
    setCollapsedChapters(updated);
  };

  const filteredTopics = topics.filter((t) => {
    if (filter !== "ALL" && t.status !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  // Group topics by chapter (outline like a book)
  const chaptersMap = filteredTopics.reduce<Record<string, ITopic[]>>(
    (acc, t) => {
      const ch = t.chapter?.trim() || "Core Curriculum";
      if (!acc[ch]) acc[ch] = [];
      acc[ch].push(t);
      return acc;
    },
    {},
  );

  const passedCount = topics.filter(
    (t) =>
      t.status === "PASSED" ||
      t.status === "MASTERED" ||
      t.status === "REVIEWING",
  ).length;
  const progressPercent =
    topics.length > 0 ? Math.round((passedCount / topics.length) * 100) : 0;

  // AI Overall Marking calculation
  const evaluatedTopics = topics.filter(
    (t) => t.masteryScore !== undefined && t.masteryScore !== null,
  );
  const avgScore =
    evaluatedTopics.length > 0
      ? Math.round(
          evaluatedTopics.reduce((acc, t) => acc + (t.masteryScore || 0), 0) /
            evaluatedTopics.length,
        )
      : null;

  const getOverallLevel = (score: number | null) => {
    if (score === null) return "NOT ASSESSED";
    if (score >= 85) return "EXPERT";
    if (score >= 70) return "ADVANCED";
    if (score >= 50) return "INTERMEDIATE";
    return "BEGINNER";
  };

  const overallLevel = getOverallLevel(avgScore);

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <IconCompass className="h-4 w-4 text-primary" />
            <span>Lifelong Learning Curriculum</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Engineering Roadmaps
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setAnalyzerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-all"
          >
            <IconRadar className="h-4 w-4" />
            <span>Analyze Tech Radar</span>
          </button>

          <button
            type="button"
            onClick={() => setGeneratorOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <IconSparkles className="h-4 w-4" />
            <span>Create / Switch Roadmap</span>
          </button>
        </div>
      </div>

      {/* Primary Tabs: Actual Roadmap vs. Secondary Tech Radar */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-muted/60 border border-border w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("MAIN")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "MAIN"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconRoad className="h-4 w-4 text-primary" />
          <span>Actual Roadmap (Main Focus)</span>
          {roadmap?.durationMonths && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-primary/10 text-primary font-semibold">
              {roadmap.durationMonths} Mo
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SECONDARY")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "SECONDARY"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <IconRadar className="h-4 w-4 text-primary" />
          <span>Secondary Roadmap (Tech Radar)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-bold text-foreground">
            {secondaryRoadmaps.length}
          </span>
        </button>
      </div>

      {/* TAB 1: MAIN ROADMAP */}
      {activeTab === "MAIN" && (
        <div className="space-y-6">
          {/* Active Roadmap Banner */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Active Main Focus
                </span>
                <h2 className="text-xl font-extrabold text-foreground mt-0.5">
                  {roadmap?.title || "No Active Roadmap"}
                </h2>
                {roadmap?.goal && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                    Goal: {roadmap.goal}
                  </p>
                )}
              </div>

              {/* Overall AI Marking Score & Level */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border self-start sm:self-auto">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <IconBrain className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    AI Evaluated Level
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-extrabold text-foreground">
                      {overallLevel}
                    </span>
                    {avgScore !== null && (
                      <span className="text-xs font-bold text-primary">
                        ({avgScore}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar & Stats */}
            {topics.length > 0 && (
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground text-sm">
                    {progressPercent}% Complete
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-foreground">{passedCount}</strong>{" "}
                    of {topics.length} topics mastered/reviewed
                  </span>
                </div>

                <div className="w-full sm:w-72 bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Search, Filter & Chapter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics in curriculum..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "ALL", label: "All" },
                  { id: "NOT_STARTED", label: "Not Started" },
                  { id: "LEARNING", label: "Learning" },
                  { id: "REVIEWING", label: "Reviewing" },
                  { id: "MASTERED", label: "Mastered" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      filter === f.id
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {Object.keys(chaptersMap).length > 1 && (
                <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-border">
                  <button
                    type="button"
                    onClick={() => toggleAllChapters(false)}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    Expand All
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <button
                    type="button"
                    onClick={() => toggleAllChapters(true)}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    Collapse
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Book / Chapter Collapsible Outline */}
          <div className="space-y-5">
            {Object.keys(chaptersMap).length === 0 ? (
              <div className="p-12 text-center bg-card border border-border rounded-3xl">
                <p className="text-xs text-muted-foreground">
                  No topics found matching your filter.
                </p>
              </div>
            ) : (
              Object.entries(chaptersMap).map(
                ([chapterTitle, chapterTopics], chIdx) => {
                  const isCollapsed = Boolean(collapsedChapters[chapterTitle]);
                  const chPassed = chapterTopics.filter(
                    (t) =>
                      t.status === "PASSED" ||
                      t.status === "MASTERED" ||
                      t.status === "REVIEWING",
                  ).length;

                  return (
                    <div
                      key={chapterTitle}
                      className="rounded-3xl border border-border bg-card/60 overflow-hidden transition-all shadow-xs"
                    >
                      {/* Chapter Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleChapter(chapterTitle)}
                        className="w-full flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <IconBook className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Chapter {chIdx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-foreground">
                              {chapterTitle}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {chPassed}/{chapterTopics.length} completed
                          </span>
                          <div className="p-1 rounded-lg text-muted-foreground">
                            {isCollapsed ? (
                              <IconChevronDown className="h-4 w-4" />
                            ) : (
                              <IconChevronUp className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Topics List inside Chapter */}
                      {!isCollapsed && (
                        <div className="p-4 space-y-2.5 bg-card/30">
                          {chapterTopics.map((topic, idx) => (
                            <TopicCard
                              key={topic._id?.toString() || idx}
                              topic={topic}
                              index={idx}
                              onOpenDetails={(t) => setSelectedTopic(t)}
                              onOpenQuiz={(t) =>
                                setQuizTopic({
                                  id: t._id.toString(),
                                  title: t.title,
                                })
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                },
              )
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SECONDARY ROADMAP (TECH RADAR & BACKLOG) */}
      {activeTab === "SECONDARY" && (
        <div className="space-y-6">
          {/* Secondary Header Banner */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <IconRadar className="h-4 w-4" />
                <span>Market Demand & Online Technology Radar</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Secondary Roadmap Backlog
              </h2>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Found a new library, system, or tool online (e.g. Docker, Kafka,
                Rust)? Analyze real company demand and career impact. Queue it
                here with target start dates or promote directly into your main
                curriculum.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAnalyzerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs self-start sm:self-auto shrink-0"
            >
              <IconPlus className="h-4 w-4" />
              <span>Analyze New Technology</span>
            </button>
          </div>

          {/* List of Secondary Roadmaps */}
          {secondaryRoadmaps.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-3xl space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mx-auto">
                <IconRadar className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Your Tech Radar is Empty
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Analyze emerging technologies like Docker, Kafka, Kubernetes, or
                Vector DBs to evaluate market demand and generate structured
                curriculums.
              </p>
              <button
                type="button"
                onClick={() => setAnalyzerOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <IconSparkles className="h-3.5 w-3.5" />
                <span>Analyze Your First Technology</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {secondaryRoadmaps.map((sRoadmap) => (
                <SecondaryRoadmapCard
                  key={sRoadmap._id?.toString()}
                  roadmap={sRoadmap}
                  onPromoted={reloadData}
                  onDeleted={reloadData}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generator Modal */}
      <RoadmapGeneratorModal
        isOpen={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        onRoadmapCreated={reloadData}
      />

      {/* Tech Analyzer Modal */}
      <TechAnalyzerModal
        isOpen={analyzerOpen}
        onClose={() => setAnalyzerOpen(false)}
        onRoadmapCreated={reloadData}
      />

      {/* Details Drawer */}
      <TopicDetailsDrawer
        topic={selectedTopic}
        isOpen={Boolean(selectedTopic)}
        onClose={() => setSelectedTopic(null)}
        onUpdated={reloadData}
        onOpenQuiz={(t) =>
          setQuizTopic({ id: t._id.toString(), title: t.title })
        }
      />

      {/* Quiz Modal */}
      {quizTopic && (
        <QuizModal
          topic={quizTopic}
          isOpen={Boolean(quizTopic)}
          onClose={() => setQuizTopic(null)}
          onCompleted={() => {
            reloadData();
            toast.success("Topic quiz submitted and updated!");
          }}
        />
      )}
    </div>
  );
}
