export interface VideoInteraction {
  _id: string;
  videoId?: string;
  type: "MultipleChoice" | "TrueFalse" | "Selection";
  startTime: number;
  endTime: number;

  // Quiz fields
  question?: string;
  options?: ReadonlyArray<string>;
  correctAnswer?: string;

  // Selection fields
  task?: string;
  items?: ReadonlyArray<{
    id: string;
    imageUrl: string;
    imageAlt: string;
    correctLabel: string;
  }>;
  labels?: ReadonlyArray<string>;

  // Shared feedback
  feedback?: {
    correct: string;
    incorrect: string;
  };
}
