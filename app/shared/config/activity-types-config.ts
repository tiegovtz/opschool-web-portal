import { ActivityType } from "~/types/activity-types";

export interface ActivityTypeConfig {
  type: ActivityType;
  title: string;
  description: string;
  iconName: string;
  color: string;
  bgColor: string;
  implemented: boolean;
}

const iconByLabel = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes("game")) return "Gamepad2";
  if (lower.includes("fraction")) return "Calculator";
  if (lower.includes("matrix")) return "Grid3X3";
  if (lower.includes("question")) return "MessageCircle";
  if (lower.includes("matching")) return "Link";
  if (lower.includes("paragraph")) return "FileText";
  if (lower.includes("alphabet")) return "BookOpen";
  if (lower.includes("shape") || lower.includes("geometry")) return "Puzzle";
  return "BookOpen";
};

export const ACTIVITY_TYPES_CONFIG: ActivityTypeConfig[] = Object.values(ActivityType).map(
  (type) => ({
    type,
    title: type,
    description: `Create a ${type.toLowerCase()} activity.`,
    iconName: iconByLabel(type),
    color: "text-oceanBlue",
    bgColor: "bg-sky-100",
    implemented: true,
  }),
);
