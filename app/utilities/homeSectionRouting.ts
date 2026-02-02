import type { tabs } from "~/types/types.data";

export const SECTION_QUERY_KEY = "section";
export const SUBJECT_QUERY_KEY = "subject";
export const SUBJECT_ID_QUERY_KEY = "subjectId";

export const SECTION_TO_TAB: Record<string, tabs> = {
  subjects: "subjects",
  "interactive-content": "interactive-contents",
  "learners-activity": "learn-activities",
  video: "video",
  "class-video": "class-videos",
  audio: "audio",
};

export const TAB_TO_SECTION: Record<tabs, string | null> = {
  subjects: "subjects",
  "interactive-contents": "interactive-content",
  "learn-activities": "learners-activity",
  video: "video",
  "class-videos": "class-video",
  audio: "audio",
  "smart-class": null,
};

export const getTabFromSection = (value: unknown): tabs | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const key = value.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(SECTION_TO_TAB, key)) {
    return SECTION_TO_TAB[key as keyof typeof SECTION_TO_TAB] ?? null;
  }
  const legacy = key as tabs;
  if (legacy in TAB_TO_SECTION) {
    return legacy ?? null;
  }
  return null;
};
