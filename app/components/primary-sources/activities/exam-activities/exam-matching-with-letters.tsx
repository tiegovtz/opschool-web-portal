"use client";

import { DragEndEvent } from "@dnd-kit/core";
import { useEffect, useState } from "react";

// Local imports
import { shuffle, toRoman } from "@/lib/utils";
import Droppable from "@/components/ui/dnd/droppable";
import Draggable from "@/components/ui/dnd/draggable";
import DNDContext from "@/components/layout/dnd-context";
import { useExamContext } from "@/shared/context/exam-context";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { QuestionAnswer } from "@/shared/context/exam-context";

export type ExamMatchingWithLettersProps = {
  questions: {
    title: string;
    questions: {
      id: string;
      text: string;
      image?: string;
      correctAnswer: string;
    }[];
    answers: string[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

// Helper function to create properly shuffled answers and return correct mapping
const createShuffledAnswers = (answers: string[], questions: any[]) => {
  // Extract letter prefixes and content separately
  const parts = answers.map((answer) => {
    const parts = answer.split("|");
    const prefix = parts[0]; // Just the letter (e.g., "A") without the period
    const content = parts.slice(1).join(".").trim(); // The rest is content
    return { prefix, content };
  });

  // Keep prefixes in order, shuffle only the content
  const shuffledContents = shuffle([...parts.map((p) => p.content)]);

  // Create a mapping to track which letter corresponds to which content after shuffling
  const contentToLetterMap = new Map();

  // For each original content, find which letter it will be associated with after shuffling
  parts.forEach((part) => {
    const originalContent = part.content;
    const newIndex = shuffledContents.findIndex(
      (content) => content === originalContent,
    );
    if (newIndex !== -1) {
      // Map original content to the letter that will display it after shuffling
      contentToLetterMap.set(originalContent, parts[newIndex].prefix);
    }
  });

  // Create mapping for correct answers (question ID to correct letter after shuffling)
  const correctAnswerMapping = new Map();
  questions.forEach((q) => {
    const originalLetter = q.correctAnswer;
    // Find the original content for this letter
    const originalContent = parts.find(
      (p) => p.prefix === originalLetter,
    )?.content;
    if (originalContent) {
      // Get the new letter for this content after shuffling
      const newLetter = contentToLetterMap.get(originalContent);
      correctAnswerMapping.set(q.id, newLetter);
    }
  });

  // Recombine in original letter order but with shuffled content
  const theParts = parts.map((part, index) => {
    const newAnswer = `${part.prefix}. ${shuffledContents[index]}`;
    return {
      display: newAnswer,
      letter: part.prefix, // Just "A", "B", etc.
      originalIndex: index,
      content: shuffledContents[index],
    };
  });

  return { shuffledAnswers: theParts, correctAnswerMapping };
};

const ExamMatchingWithLetters = ({
  questions,
  activityIndex,
  activityId,
  onStateUpdate,
}: ExamMatchingWithLettersProps) => {
  const [answers, setAnswers] = useState<(string | undefined)[]>([]);

  const { playSound } = useSoundEffects();
  const { collectAnswers, updateActivityScore } = useExamContext();

  // Track both shuffled answers and correct answer mapping
  const [shuffledState] = useState(() => {
    return createShuffledAnswers([...questions.answers], questions.questions);
  });

  const shuffledAnswers = shuffledState.shuffledAnswers;
  const correctAnswerMapping = shuffledState.correctAnswerMapping;

  // Calculate score for this activity
  const calculateScore = () => {
    let score = 0;
    const detailedAnswers: QuestionAnswer[] = [];

    questions.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const correctAnswer = correctAnswerMapping.get(question.id);
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) {
        score++;
      }

      // Store detailed answer information
      detailedAnswers.push({
        questionId: question.id,
        userAnswer: userAnswer || "",
        correctAnswer: correctAnswer || "",
        isCorrect,
        question: question.text,
        image: question.image,
        options: shuffledAnswers.map((answer) => answer.display),
      });
    });

    return { score, answers: detailedAnswers };
  };

  // Update activity score whenever collectAnswers changes
  useEffect(() => {
    if (!collectAnswers) return;

    const { score, answers } = calculateScore();

    updateActivityScore(activityIndex, {
      activityId,
      activityIndex,
      score,
      totalQuestions: questions.questions.length,
      answers,
    });
  }, [collectAnswers]);

  useEffect(() => {
    const answeredCount = answers.filter(
      (answer) => answer !== undefined,
    ).length;
    onStateUpdate?.(questions.questions.length, answeredCount);
  }, [answers]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active) return;

    const draggedItemLetter = active.id as string;

    // If there's no valid drop target, remove the answer
    if (!over) {
      playSound("click");

      setAnswers((prev) => {
        const newAnswers = [...prev];

        // Find if the dragged item is currently placed somewhere
        const currentIndex = newAnswers.findIndex(
          (answer) => answer === draggedItemLetter,
        );

        // Remove it from its current position (return to options pool)
        if (currentIndex !== -1) {
          newAnswers[currentIndex] = undefined;
        }

        return newAnswers;
      });

      return;
    }

    const targetQuestionIndex = Number(over.id.toString().replace("q-", ""));

    if (isNaN(targetQuestionIndex)) return;

    playSound("click");

    setAnswers((prev) => {
      const newAnswers = [...prev];

      // Find if the dragged item is currently placed somewhere
      const currentIndex = newAnswers.findIndex(
        (answer) => answer === draggedItemLetter,
      );

      // If target position already has an answer, we need to swap
      if (newAnswers[targetQuestionIndex]) {
        const existingAnswer = newAnswers[targetQuestionIndex];

        // If dragged item was already placed, swap them
        if (currentIndex !== -1) {
          newAnswers[currentIndex] = existingAnswer;
        }
        // Otherwise, the existing answer goes back to available pool
        else {
          // Find first empty slot or remove it (will be available in pool)
          const emptyIndex = newAnswers.findIndex((answer) => !answer);
          if (emptyIndex !== -1) {
            newAnswers[emptyIndex] = existingAnswer;
          }
        }
      } else {
        // Target is empty, just remove from current position if it exists
        if (currentIndex !== -1) {
          newAnswers[currentIndex] = undefined;
        }
      }

      // Place the dragged item in the target position
      newAnswers[targetQuestionIndex] = draggedItemLetter;

      return newAnswers;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <DNDContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row justify-between h-full overflow-auto pb-2">
          <div className="bg-white flex flex-col md:rounded-bl-xl justify-between w-full md:max-h-[calc(100dvh-100px)] p-4">
            <div className="flex flex-col gap-y-4">
              {questions.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex gap-4 items-center text-picton-blue-700 text-lg"
                >
                  <p>{toRoman(index + 1)}.</p>
                  <div className="flex gap-4 items-center justify-between w-full">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      {question.image && (
                        <img
                          src={question?.image}
                          alt={question.text}
                          className="h-16 sm:h-24"
                        />
                      )}
                      <span>{question.text}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {answers[index] ? (
                        <Draggable
                          id={answers[index]}
                          className="bg-lemon-200 text-lemon-700 rounded w-14 h-10 text-xl font-semibold flex items-center justify-center cursor-move"
                        >
                          {answers[index]}
                        </Draggable>
                      ) : (
                        <Droppable
                          id={`q-${index}`}
                          isOverClassName="bg-lemon-200"
                          className="bg-picton-blue-200 rounded w-14 h-10"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-full rounded-xl gap-y-4">
              <h3 className="font-semibold mb-2">Options</h3>
              <div className="flex gap-4 text-lg flex-wrap">
                {shuffledAnswers
                  .filter((answer) => !answers.includes(answer.letter))
                  .map((answer, i) => (
                    <Draggable
                      key={i}
                      id={answer.letter}
                      className="flex justify-center gap-4 rounded text-xl font-semibold w-14 h-10 items-center text-lemon-700 bg-lemon-200 cursor-move"
                    >
                      <span>{answer.letter}</span>
                    </Draggable>
                  ))}
              </div>
              {shuffledAnswers.filter(
                (answer) => !answers.includes(answer.letter),
              ).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  All options have been used
                </div>
              )}
            </div>
          </div>

          <div className="bg-white w-full rounded-bl-xl md:rounded-bl-none rounded-br-xl text-lg flex flex-col gap-4 p-4 max-h-[calc(100dvh-100px)] overflow-auto">
            {shuffledAnswers.map((answer, i) => (
              <div className="flex gap-4 items-center" key={i}>
                <p>
                  <span className="font-semibold text-xl">
                    {answer.display.slice(0, 1)})
                  </span>
                  <span>{answer.display.slice(2)}</span>
                </p>
                <div className="h-10" />
              </div>
            ))}
          </div>
        </div>
      </DNDContext>

      {/* Progress indicators at bottom */}
      {/* <div className="border-t bg-white p-4">
        <div className="flex justify-center">
          <div className="flex gap-2 flex-wrap">
            {questions.questions.map((question, index) => {
              const isAnswered = answers[index];

              return (
                <div
                  key={question.id}
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold border-2",
                    {
                      "bg-picton-blue-500 text-white border-picton-blue-500":
                        isAnswered,
                      "bg-gray-100 text-gray-400 border-gray-200": !isAnswered,
                    }
                  )}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default ExamMatchingWithLetters;
