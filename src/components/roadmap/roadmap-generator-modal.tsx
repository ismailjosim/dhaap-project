"use client";

import {
  IconBrain,
  IconCheck,
  IconClock,
  IconFlame,
  IconLoader,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import type { GeneratedRoadmap } from "@/lib/ai";

interface RoadmapGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoadmapCreated: () => void;
}

const STARTER_PRESETS: GeneratedRoadmap[] = [
  {
    title: "CSE Fundamentals (Core Mastery)",
    goal: "Master foundational Computer Science pillars (DSA, OS, Networking, Databases) required for senior technical interviews.",
    topics: [
      {
        title: "Arrays, Hashing & Two Pointers",
        description:
          "Hash maps, space-time complexity analysis, array slicing, and pointer manipulation.",
        estimatedMinutes: 90,
      },
      {
        title: "Trees, Graphs & BFS/DFS Traversal",
        description:
          "Binary Search Trees, level-order traversal, graph representations, and cycle detection.",
        estimatedMinutes: 90,
      },
      {
        title: "OS Processes, Threads & Synchronization",
        description:
          "Context switching, process state diagrams, race conditions, mutexes, and semaphores.",
        estimatedMinutes: 90,
      },
      {
        title: "Virtual Memory, Paging & Page Faults",
        description:
          "Memory hierarchy, TLB, page tables, page replacement algorithms, and memory fragmentation.",
        estimatedMinutes: 90,
      },
      {
        title: "TCP/IP 3-Way Handshake & Flow Control",
        description:
          "TCP vs UDP, sliding window protocol, congestion control algorithms, and socket lifecycle.",
        estimatedMinutes: 90,
      },
      {
        title: "DNS Resolution, HTTPS & TLS Handshake",
        description:
          "Hierarchical DNS resolution, SSL/TLS certificates, symmetric vs asymmetric encryption.",
        estimatedMinutes: 90,
      },
      {
        title: "B-Trees, Database Indexing & Query Plans",
        description:
          "Clustered vs non-clustered indexes, composite indexing, EXPLAIN analysis, and scan types.",
        estimatedMinutes: 90,
      },
      {
        title: "ACID Transactions & Isolation Levels",
        description:
          "Dirty reads, phantom reads, 2-phase locking, MVCC, and write-ahead logging.",
        estimatedMinutes: 90,
      },
    ],
  },
  {
    title: "Backend & Distributed Systems Mastery",
    goal: "Build resilient, distributed backends with event streaming, caching, and consensus protocols.",
    topics: [
      {
        title: "Event-Driven Architecture & Kafka Partitions",
        description:
          "Producer/Consumer patterns, consumer groups, partition keys, and offset commit semantics.",
        estimatedMinutes: 90,
      },
      {
        title: "Redis Caching Strategies & Eviction Policies",
        description:
          "Cache-aside, write-through, TTL strategies, cache stampede prevention, and Redis cluster.",
        estimatedMinutes: 90,
      },
      {
        title: "Distributed Locking & Consensus (Raft/Paxos)",
        description:
          "Redlock algorithm, split-brain problem, leader election, and leader-based replication.",
        estimatedMinutes: 90,
      },
      {
        title: "Database Sharding & Consistent Hashing",
        description:
          "Horizontal scaling, shard key selection, cross-shard joins, and consistent hashing rings.",
        estimatedMinutes: 90,
      },
      {
        title: "Idempotency & Handling Partial Failures",
        description:
          "Idempotency keys, retry backoff with jitter, dead letter queues, and saga pattern.",
        estimatedMinutes: 90,
      },
    ],
  },
];

export function RoadmapGeneratorModal({
  isOpen,
  onClose,
  onRoadmapCreated,
}: RoadmapGeneratorModalProps) {
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("Intermediate software engineer");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<GeneratedRoadmap | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: GeneratedRoadmap) => {
    setDraft(preset);
    toast.info(`Loaded preset: "${preset.title}". You can review and save.`);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      toast.warning("Please enter your target engineering goal.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/roadmaps/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, level }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setDraft(data.draft);
      toast.success("AI Curriculum generated! Review and customize below.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTopic = (index: number) => {
    if (!draft) return;
    setDraft({
      ...draft,
      topics: draft.topics.filter((_, i) => i !== index),
    });
  };

  const handleSaveRoadmap = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          goal: draft.goal,
          topics: draft.topics,
          setAsActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save roadmap");
      }

      toast.success("Roadmap created and activated!");
      onRoadmapCreated();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <IconSparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                AI Roadmap Generator
              </h3>
              <p className="text-xs text-muted-foreground">
                Turn your ambitious career goal into an actionable daily
                syllabus
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {!draft ? (
            <div className="space-y-5">
              {/* Quick Starter Templates */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Or Start with a Curated Roadmap
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STARTER_PRESETS.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className="p-3.5 rounded-2xl border border-border bg-muted/30 text-left hover:border-primary/40 hover:bg-card transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {p.title}
                        </span>
                        <IconFlame className="h-4 w-4 text-primary shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {p.goal}
                      </p>
                      <span className="text-[10px] font-semibold text-foreground/70 mt-2 block">
                        {p.topics.length} core topics
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Custom AI Generation
                </span>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label
                    htmlFor="goal-input"
                    className="block text-xs font-semibold text-foreground/80 mb-1.5"
                  >
                    What is your specific learning goal?
                  </label>
                  <input
                    id="goal-input"
                    type="text"
                    required
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer (Node.js, Distributed Systems, Redis, Postgres)"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="level-select"
                    className="block text-xs font-semibold text-foreground/80 mb-1.5"
                  >
                    Current Level
                  </label>
                  <select
                    id="level-select"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  >
                    <option value="Beginner programmer">
                      Beginner programmer
                    </option>
                    <option value="Junior software engineer">
                      Junior software engineer
                    </option>
                    <option value="Intermediate software engineer">
                      Intermediate software engineer
                    </option>
                    <option value="Senior wanting to specialize in distributed systems">
                      Senior looking to master distributed systems
                    </option>
                  </select>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading || !goal.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {loading ? (
                      <>
                        <IconLoader className="h-4 w-4 animate-spin" />
                        <span>Designing curriculum...</span>
                      </>
                    ) : (
                      <>
                        <IconBrain className="h-4 w-4" />
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Draft Roadmap
                </span>
                <h4 className="text-lg font-bold text-foreground mt-0.5">
                  {draft.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {draft.goal}
                </p>
                <span className="text-[11px] font-semibold text-foreground/80 mt-2 block">
                  {draft.topics.length} sequential topics
                </span>
              </div>

              <div className="space-y-2">
                {draft.topics.map((topic, idx) => (
                  <div
                    key={topic.title}
                    className="flex items-start justify-between p-3.5 rounded-2xl border border-border bg-card"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">
                          {idx + 1}.
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {topic.title}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          <IconClock className="h-3 w-3" />
                          <span>{topic.estimatedMinutes}m</span>
                        </span>
                      </div>
                      {topic.description && (
                        <p className="text-xs text-muted-foreground pl-5">
                          {topic.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive-soft"
                      title="Remove topic"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:bg-muted"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleSaveRoadmap}
                  disabled={saving || draft.topics.length === 0}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving ? (
                    <IconLoader className="h-4 w-4 animate-spin" />
                  ) : (
                    <IconCheck className="h-4 w-4" />
                  )}
                  <span>Save & Activate Roadmap</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
