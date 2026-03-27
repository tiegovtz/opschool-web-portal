import { ActivityType } from "@/lib/types/activity-types";

export type ActivityTypeConfig = {
  type: ActivityType;
  title: string;
  description: string;
  implemented: boolean;
  formComponent: string;
  iconName: string;
  color: string;
  bgColor: string;
};

const styleForType = (title: string) => {
  const normalized = title.toLowerCase();

  if (normalized.includes("matching")) {
    return {
      iconName: "lucide:git-compare-arrows",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    };
  }

  if (normalized.includes("paragraph") || normalized.includes("sentence") || normalized.includes("comprehension")) {
    return {
      iconName: "lucide:file-text",
      color: "text-picton-blue-700",
      bgColor: "bg-picton-blue-100",
    };
  }

  if (normalized.includes("crossword") || normalized.includes("hidden word") || normalized.includes("pattern")) {
    return {
      iconName: "lucide:puzzle",
      color: "text-violet-700",
      bgColor: "bg-violet-100",
    };
  }

  if (normalized.includes("abacus") || normalized.includes("matrix") || normalized.includes("number")) {
    return {
      iconName: "lucide:calculator",
      color: "text-amber-700",
      bgColor: "bg-amber-100",
    };
  }

  if (normalized.includes("diagram") || normalized.includes("picture") || normalized.includes("label")) {
    return {
      iconName: "lucide:image",
      color: "text-rose-700",
      bgColor: "bg-rose-100",
    };
  }

  return {
    iconName: "lucide:layout-grid",
    color: "text-oceanBlue",
    bgColor: "bg-sky-100",
  };
};

const descriptionForType = (title: string) => `Create and configure "${title}" activities.`;

export const ACTIVITY_TYPES_CONFIG: ActivityTypeConfig[] = Object.values(ActivityType).map((type) => ({
  type,
  title: type,
  description: descriptionForType(type),
  implemented: true,
  formComponent: "generic",
  ...styleForType(type),
}));

export const getActivityTypeConfig = (activityType: ActivityType | string) =>
  ACTIVITY_TYPES_CONFIG.find((item) => item.type === activityType) || null;

