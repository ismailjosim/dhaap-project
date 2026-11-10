interface StatRingProps {
  plannedMinutes: number;
  doneMinutes: number;
}

export function StatRing({ plannedMinutes, doneMinutes }: StatRingProps) {
  const percentage =
    plannedMinutes > 0
      ? Math.min(100, Math.round((doneMinutes / plannedMinutes) * 100))
      : 0;

  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-xs">
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          className="h-20 w-20 transform -rotate-90"
          viewBox="0 0 80 80"
          role="img"
          aria-label="Progress Ring"
        >
          <title>Daily focus progress ring</title>
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="7"
            fill="transparent"
            className="text-muted"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="7"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-sm font-bold text-foreground">
            {percentage}%
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            done
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today's Focus Budget
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {doneMinutes}
          </span>
          <span className="text-xs text-muted-foreground">
            / {plannedMinutes} min
          </span>
        </div>
        <p className="text-xs text-muted-foreground/80">
          {plannedMinutes - doneMinutes > 0
            ? `${plannedMinutes - doneMinutes} minutes remaining`
            : "Daily target accomplished!"}
        </p>
      </div>
    </div>
  );
}
