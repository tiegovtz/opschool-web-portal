export interface VideoInteraction {
  _id: string;
  videoId?: string;
  type: "Quiz" | "Selection";
  startTime: number;
  endTime: number;

  // Quiz fields
  question?: string;
  options?: string[];
  correctAnswer?: string;

  // Selection fields
  task?: string;
  items?: {
    id: string;
    imageUrl: string;
    imageAlt: string;
    correctLabel: string;
  }[];
  labels?: string[];

  // Shared feedback
  feedback?: {
    correct: string;
    incorrect: string;
  };
}
