export interface CreateChapterProgress {
  userId: string;              // ID of the user
  chapterId: string;           // ID of the chapter
  videoProgress: number;       // e.g. percentage watched (0–100)
  notesProgress: number;       // e.g. percentage read (0–100)
  experimentsAttempted: number;
  totalExperiments: number;
  assessmentsAttempted: number;
  totalAssessments: number;
}

export interface UpdateChapterProgress {
  videoProgress: number;           // e.g. percentage watched (0–100)
  notesProgress: number;           // e.g. percentage read (0–100)
  experimentsAttempted: number;
  assessmentsAttempted: number;
  isCompleted: boolean;
  completedAt: string;             // ISO date string (or use Date type if preferred)
}
