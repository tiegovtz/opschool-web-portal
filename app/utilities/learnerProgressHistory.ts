import type { Question } from "~/types/question.interface";

type StableQuestionIdInput = {
  chapterId: string;
  questionId?: string | null;
  questionNumber?: string | number | null;
  questionText?: string | null;
};

export const buildStableQuestionId = ({
  chapterId,
  questionId,
  questionNumber,
  questionText,
}: StableQuestionIdInput): string => {
  const normalizedQuestionId = String(questionId ?? "").trim();
  if (normalizedQuestionId) {
    return normalizedQuestionId;
  }

  const normalizedQuestionNumber = String(questionNumber ?? "").trim();
  if (normalizedQuestionNumber) {
    return `${chapterId}:${normalizedQuestionNumber}`;
  }

  const normalizedQuestionText = String(questionText ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (normalizedQuestionText) {
    return `${chapterId}:${normalizedQuestionText}`;
  }

  return `${chapterId}:unknown-question`;
};

export const buildChapterQuizId = (chapterId: string) =>
  `chapter-quiz:${chapterId}`;

export const buildVideoQuizId = (videoId: string, quizId: string) =>
  `video-quiz:${videoId}:${quizId}`;

export const getChapterQuestionType = (question: Question) => {
  if (question.questionType === "drag_and_drop") {
    return "drag_and_drop" as const;
  }

  return "multiple_choice" as const;
};
