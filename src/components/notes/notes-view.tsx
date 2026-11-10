"use client";

import {
  IconCheck,
  IconEye,
  IconLoader,
  IconNotes,
  IconPencil,
  IconSearch,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { INote, ITopic } from "@/lib/models";

interface NotesViewProps {
  initialNotes: (INote & { topic?: ITopic })[];
  topics: ITopic[];
  selectedTopicId?: string;
}

export function NotesView({
  initialNotes,
  topics,
  selectedTopicId,
}: NotesViewProps) {
  const [activeTopicId, setActiveTopicId] = useState<string>(
    selectedTopicId || (topics[0]?._id?.toString() ?? ""),
  );
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const n of initialNotes) {
      map[n.topicId] = n.body;
    }
    return map;
  });

  const [currentBody, setCurrentBody] = useState<string>(
    notesMap[activeTopicId] || "",
  );
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setCurrentBody(notesMap[activeTopicId] || "");
  }, [activeTopicId, notesMap]);

  const activeTopic = topics.find((t) => t._id.toString() === activeTopicId);

  const handleSave = async () => {
    if (!activeTopicId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/topics/${activeTopicId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: currentBody }),
      });

      if (!res.ok) throw new Error("Failed to save note");

      setNotesMap((prev) => ({ ...prev, [activeTopicId]: currentBody }));
      toast.success("Notes saved successfully!");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  const filteredTopics = topics.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <IconNotes className="h-4 w-4 text-primary" />
          <span>Knowledge Repository</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
          Engineering Notes
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Capture core mental models, code snippets, and reflections for each
          topic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left: Topic Selector */}
        <div className="space-y-3 bg-card border border-border rounded-2xl p-4 shadow-xs">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-1">
            {filteredTopics.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No topics found.
              </p>
            ) : (
              filteredTopics.map((t) => {
                const isSelected = t._id.toString() === activeTopicId;
                const hasNote = Boolean(notesMap[t._id.toString()]?.trim());
                return (
                  <button
                    key={t._id.toString()}
                    type="button"
                    onClick={() => setActiveTopicId(t._id.toString())}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="truncate pr-2">{t.title}</span>
                    {hasNote && (
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          isSelected ? "bg-white" : "bg-primary"
                        }`}
                        title="Has saved notes"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Markdown Note Editor & Preview */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {activeTopic?.title || "Select a Topic"}
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Markdown format supported
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {previewMode ? (
                  <IconPencil className="h-3.5 w-3.5" />
                ) : (
                  <IconEye className="h-3.5 w-3.5" />
                )}
                <span>{previewMode ? "Edit" : "Preview"}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !activeTopicId}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xs"
              >
                {saving ? (
                  <IconLoader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <IconCheck className="h-3.5 w-3.5" />
                )}
                <span>Save</span>
              </button>
            </div>
          </div>

          {previewMode ? (
            <div className="min-h-[350px] p-4 rounded-xl bg-muted/20 border border-border/80 prose dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {currentBody.trim() ? (
                currentBody
              ) : (
                <span className="text-muted-foreground italic">
                  No notes written yet. Switch to Edit mode to write.
                </span>
              )}
            </div>
          ) : (
            <textarea
              rows={16}
              value={currentBody}
              onChange={(e) => setCurrentBody(e.target.value)}
              placeholder="Write technical summaries, architectural tradeoffs, code examples, or key takeaways here..."
              className="w-full p-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-y font-mono"
            />
          )}
        </div>
      </div>
    </div>
  );
}
