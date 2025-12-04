import type { tabs } from "~/types/types.data";

export function getTabLabel(tab: tabs): string {
  const labels: Record<tabs, string> = {
    subjects: 'Subject(s)',
    'interactive-contents': 'Interactive Content(s)',
    'learn-activities': 'Learn Activity(s)',
    video: 'Video(s)',
    'class-videos': 'Class Video(s)',
    audio: 'Audio(s)',
    'smart-class': 'Smart Class Content(s)',
  };

  return labels[tab] ?? '';
}
