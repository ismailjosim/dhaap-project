import {
  IconAlertCircle,
  IconBookmark,
  IconCheck,
  IconCircleDashed,
  IconClock,
  IconFlame,
  IconPlayerPlay,
  IconSparkles,
} from "@tabler/icons-react";
import type { TopicStatus } from "@/core/types";

interface StatusBadgeProps {
  status: TopicStatus;
  className?: string;
}

const statusConfig: Record<
  TopicStatus,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  NOT_STARTED: { label: "Not Started", icon: IconCircleDashed },
  LEARNING: { label: "Learning", icon: IconPlayerPlay },
  QUIZ_PENDING: { label: "Quiz Ready", icon: IconClock },
  PASSED: { label: "Passed", icon: IconCheck },
  REVIEWING: { label: "Reviewing", icon: IconSparkles },
  MASTERED: { label: "Mastered", icon: IconFlame },
  NEEDS_RECAP: { label: "Needs Recap", icon: IconAlertCircle },
  DEFERRED: { label: "Deferred", icon: IconBookmark },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.NOT_STARTED;
  const IconComponent = config.icon;

  return (
    <span className={`status-chip ${className}`} data-status={status}>
      <IconComponent className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
