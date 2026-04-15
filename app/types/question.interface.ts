export type questionType = "multiple_choice" | "drag_and_drop";

export const ANSWER_SEPARATOR = "<!-/>";

export interface Choice {
  _id: string;
  value: string;
  description: string;
}

export interface Question {
  _id?: string;
  questionType: questionType;
  question: string;
  trueAnswer: string;
  choices: Choice[];
  answer: string;
  number: string;
  thumbnail: string;
  blanks?: number;
}
