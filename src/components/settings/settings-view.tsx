"use client";

import { IconCheck, IconLoader, IconSettings } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import type { IUserSettings } from "@/lib/models";

interface SettingsViewProps {
  initialSettings: IUserSettings;
}

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function SettingsView({ initialSettings }: SettingsViewProps) {
  const [dailyCap, setDailyCap] = useState(
    initialSettings.dailyCapMinutes ?? 240,
  );
  const [recapCap, setRecapCap] = useState(
    initialSettings.recapCapMinutes ?? 30,
  );
  const [passScore, setPassScore] = useState(initialSettings.passScore ?? 70);
  const [timezone, setTimezone] = useState(
    initialSettings.timezone || "Asia/Dhaka",
  );
  const [restDays, setRestDays] = useState<number[]>(
    initialSettings.restWeekdays || [],
  );
  const [saving, setSaving] = useState(false);

  const toggleRestDay = (day: number) => {
    setRestDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyCapMinutes: Number(dailyCap),
          recapCapMinutes: Number(recapCap),
          passScore: Number(passScore),
          timezone,
          restWeekdays: restDays,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <IconSettings className="h-4 w-4 text-primary" />
          <span>Preferences & Caps</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
          Engine Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Tune your daily focus limits, passing thresholds, and rest days.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-5 bg-card border border-border rounded-2xl p-6 shadow-xs"
      >
        {/* Daily Cap */}
        <div>
          <label
            htmlFor="daily-cap-input"
            className="block text-xs font-bold text-foreground mb-1"
          >
            Daily Study Cap (Minutes)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="daily-cap-input"
              type="number"
              min={30}
              max={600}
              step={15}
              value={dailyCap}
              onChange={(e) => setDailyCap(Number(e.target.value))}
              className="w-32 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            <span className="text-xs text-muted-foreground">
              Maximum minutes of topics scheduled each day (
              {Math.round((dailyCap / 60) * 10) / 10} hours)
            </span>
          </div>
        </div>

        {/* Recap Cap */}
        <div>
          <label
            htmlFor="recap-cap-input"
            className="block text-xs font-bold text-foreground mb-1"
          >
            Recap / Review Cap (Minutes)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="recap-cap-input"
              type="number"
              min={15}
              max={120}
              step={5}
              value={recapCap}
              onChange={(e) => setRecapCap(Number(e.target.value))}
              className="w-32 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            <span className="text-xs text-muted-foreground">
              Maximum time allocated to recap/review before new topics
            </span>
          </div>
        </div>

        {/* Pass Score */}
        <div>
          <label
            htmlFor="pass-score-input"
            className="block text-xs font-bold text-foreground mb-1"
          >
            Passing Threshold Score (%)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="pass-score-input"
              type="number"
              min={50}
              max={95}
              step={5}
              value={passScore}
              onChange={(e) => setPassScore(Number(e.target.value))}
              className="w-32 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            <span className="text-xs text-muted-foreground">
              Score required on rubric quiz to mark topic as passed (default:
              70%)
            </span>
          </div>
        </div>

        {/* Rest Days */}
        <div>
          <span className="block text-xs font-bold text-foreground mb-2">
            Weekly Rest Days (Zero-pressure pause)
          </span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const isSelected = restDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleRestDay(day.value)}
                  className={`h-9 w-12 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1.5 block">
            On rest days, daily plans remain empty and carry-overs are
            gracefully deferred.
          </span>
        </div>

        {/* Timezone */}
        <div>
          <label
            htmlFor="timezone-select"
            className="block text-xs font-bold text-foreground mb-1"
          >
            Your Timezone
          </label>
          <select
            id="timezone-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full sm:w-72 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary"
          >
            <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
            <option value="UTC">UTC</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New York (EST)</option>
            <option value="America/Los_Angeles">
              America/Los Angeles (PST)
            </option>
          </select>
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? (
              <IconLoader className="h-4 w-4 animate-spin" />
            ) : (
              <IconCheck className="h-4 w-4" />
            )}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
