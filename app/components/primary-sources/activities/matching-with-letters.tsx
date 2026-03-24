"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { DragEndEvent } from "@dnd-kit/core";
import React, { useEffect, useState } from "react";

// Local imports
import { shuffle } from "@/lib/utils";
import Droppable from "../../../../../tie_open_school_primary_frontend/components/ui/dnd/droppable";
import Draggable from "../../../../../tie_open_school_primary_frontend/components/ui/dnd/draggable";
import DNDContext from "../../../../../tie_open_school_primary_frontend/components/layout/dnd-context";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

type TMatchingWithLettersActivityProps = {
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

const MatchingWithLettersActivity = ({
  questions,
}: TMatchingWithLettersActivityProps) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [answers, setAnswers] = useState<(string | undefined)[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { playSound } = useSoundEffects();

  // Track both shuffled answers and correct answer mapping
  const [shuffledState, setShuffledState] = useState(() => {
    return createShuffledAnswers([...questions.answers], questions.questions);
  });

  const shuffledAnswers = shuffledState.shuffledAnswers;
  const correctAnswerMapping = shuffledState.correctAnswerMapping;

  useEffect(() => {
    if (
      answers.length === questions.questions.length &&
      !answers.includes(undefined)
    ) {
      const score = answers.reduce((acc, answer, index) => {
        const question = questions.questions[index];
        // Use the correct answer mapping to check if the answer is correct
        const correctLetterForQuestion = correctAnswerMapping.get(question.id);
        return acc + (answer === correctLetterForQuestion ? 1 : 0);
      }, 0);
      setScore(score);
      setAllAnswered(true);
      playSound("success");
    }
  }, [answers, questions.questions, correctAnswerMapping]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active) return;

    // Don't allow changes when showing results
    if (showResults) return;

    // If there's no drop target (dragged outside droppable zones), remove the answer
    if (!over) {
      setAnswers((prevAnswers) => {
        const newAnswers = [...prevAnswers];
        const index = newAnswers.findIndex(
          (answer) => answer === String(active.id),
        );
        if (index !== -1) {
          newAnswers[index] = undefined;
        }
        return newAnswers;
      });
      playSound("click");
      return;
    }

    const question = questions.questions.find(
      (question) => question.id === String(over.id),
    );
    if (!question) return;

    // set the answer into the answers array on the same index as the question index.
    // If the answer is already their but the user wants to change it, then replace the answer.
    setAnswers((prevAnswers) => {
      const newAnswers = [...prevAnswers];
      const index = newAnswers.findIndex(
        (answer) => answer === String(active.id),
      );
      if (index !== -1) {
        newAnswers[index] = undefined;
      }
      newAnswers[parseInt(question.id) - 1] = String(active.id);
      return newAnswers;
    });

    playSound("click");
  };

  const resetActivity = () => {
    setShowResults(false);
    setAllAnswered(false);
    setScore(0);
    setAnswers([]);
    // Update both the shuffled answers and the correct answer mapping
    const newShuffledState = createShuffledAnswers(
      [...questions.answers],
      questions.questions,
    );
    setShuffledState(newShuffledState);
  };

  const isAnswerCorrect = (questionIndex: number) => {
    const question = questions.questions[questionIndex];
    const answer = answers[questionIndex];
    const correctLetter = correctAnswerMapping.get(question.id);
    return answer === correctLetter;
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={questions.title} />

      <DNDContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row justify-between h-full overflow-auto gap-4">
          <div className="bg-picton-blue-50 flex flex-col justify-between w-full rounded-xl md:max-h-[calc(100dvh-100px)] md:overflow-y-auto p-4">
            <div className="flex flex-col gap-y-4">
              {questions.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex gap-4 items-center text-picton-blue-700 text-lg"
                >
                  <p>{index + 1}.</p>
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
                        <>
                          {showResults ? (
                            <div
                              className={`${
                                isAnswerCorrect(index)
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              } rounded w-14 h-10 flex items-center justify-center`}
                            >
                              {answers[index]}
                            </div>
                          ) : (
                            <Draggable
                              id={answers[index]}
                              className="bg-lemon-200 text-lemon-700 rounded w-14 h-10 text-xl font-semibold flex items-center justify-center"
                            >
                              {answers[index]}
                            </Draggable>
                          )}
                          {showResults && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                              }}
                            >
                              {isAnswerCorrect(index) ? (
                                <Check className="text-green-500" />
                              ) : (
                                <X className="text-red-500" />
                              )}
                            </motion.div>
                          )}
                        </>
                      ) : (
                        <Droppable
                          id={question.id}
                          isOverClassName="bg-lemon-200"
                          className="bg-picton-blue-200 rounded w-14 h-10"
                        ></Droppable>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col w-full rounded-xl gap-y-4">
              {showResults ? (
                <ActivityResults
                  score={score}
                  total={questions.questions.length}
                  onRestart={resetActivity}
                />
              ) : (
                <>
                  <h3 className="font-semibold mb-2">Options</h3>
                  <div className="flex flex-wrap gap-4 text-lg">
                    {!showResults &&
                      shuffledAnswers
                        .filter((answer) => !answers.includes(answer.letter))
                        .map((answer, i) => (
                          <Draggable
                            key={i}
                            id={answer.letter}
                            className="flex justify-center gap-4 rounded text-xl font-semibold w-14 h-10 items-center text-lemon-700 bg-lemon-200"
                          >
                            <span>{answer.letter}</span>
                          </Draggable>
                        ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-picton-blue-50 w-full rounded-xl text-lg flex flex-col gap-4 p-4 md:max-h-[calc(100dvh-100px)] md:overflow-auto">
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

      <ActivityResultsAlertDialog
        score={score}
        total={questions.questions.length}
        open={allAnswered && !showResults}
        onOpenChange={(open) => {
          setAllAnswered(false);
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </div>
  );
};

export default MatchingWithLettersActivity;
