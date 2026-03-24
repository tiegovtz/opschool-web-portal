"use client";

import { Check, X } from "lucide-react";
import { FC, useState, useEffect } from "react";
import { DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";

// Local imports
import { cn, getImageUrl } from "@/lib/utils";
import DNDContext from "../../../../../tie_open_school_primary_frontend/components/layout/dnd-context";
import Droppable from "@/components/ui/dnd/droppable";
import Draggable from "@/components/ui/dnd/draggable";
import ActivityResults from "@/components/templates/results";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { ActivityComponentProps } from "@/lib/types/activity-types";
import { ActivityResultsAlertDialog } from "@/components/templates/results";

type PatternMatchingActivityProps = ActivityComponentProps & {
  questions: {
    title: string;
    patterns: string[][];
    patternAnswers: string[];
    imageMap: { [key: string]: string };
    draggableItems: string[];
  };
};

const PatternMatchingActivity: FC<PatternMatchingActivityProps> = ({
  questions,
  // feedback = "wrong-correct",
  // activityId,
  // userId,
  onActivityComplete,
  onAnswerRecorded,
}) => {
  const [answers, setAnswers] = useState<(string | null)[]>(
    Array(questions.patterns.length).fill(null),
  );
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { playSound } = useSoundEffects();

  useEffect(() => {
    if (answers.every((answer) => answer !== null)) {
      setAllAnswered(true);
      playSound("success");
    }
  }, [answers, playSound]);

  useEffect(() => {
    if (allAnswered) {
      const finalScore = answers.reduce((acc, answer, index) => {
        return acc + (answer === questions.patternAnswers[index] ? 1 : 0);
      }, 0);
      setScore(finalScore);

      // Call completion callback if provided
      if (onActivityComplete) {
        onActivityComplete(finalScore, questions.patterns.length, answers);
      }
    }
  }, [
    allAnswered,
    answers,
    questions.patternAnswers,
    questions.patterns.length,
    onActivityComplete,
  ]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Check if dragging from answered area
    const isDraggingFromAnswer = String(active.id).startsWith("answer-");

    if (isDraggingFromAnswer) {
      // Extract the original item ID and row index from answer drag
      const answerParts = String(active.id).split("-");
      const rowIndex = parseInt(answerParts[1]);
      const originalItemId = answerParts[2];

      // If dropped on a dropzone, move the answer there
      if (over && String(over.id).startsWith("dropzone-")) {
        const newDropzoneIndex = parseInt(String(over.id).split("-")[1]);
        const newAnswers = [...answers];

        // Remove from original position
        newAnswers[rowIndex] = null;
        // Add to new position
        newAnswers[newDropzoneIndex] = originalItemId;

        setAnswers(newAnswers);
        playSound("click");
      } else {
        // If not dropped on a dropzone, remove the answer (drag away to remove)
        const newAnswers = [...answers];
        newAnswers[rowIndex] = null;
        setAnswers(newAnswers);
        playSound("click");
      }
    } else {
      // Normal dragging from draggable items area
      if (over && String(over.id).startsWith("dropzone-")) {
        const dropzoneIndex = parseInt(String(over.id).split("-")[1]);
        const newAnswers = [...answers];

        newAnswers[dropzoneIndex] = active.id as string;
        setAnswers(newAnswers);

        // Record answer if callback provided
        if (onAnswerRecorded) {
          const isCorrect =
            (active.id as string) === questions.patternAnswers[dropzoneIndex];
          onAnswerRecorded(dropzoneIndex, active.id as string, isCorrect);
        }

        playSound("click");
      }
    }

    setActiveId(null);
  };

  const resetActivity = () => {
    setAnswers(Array(questions.patterns.length).fill(null));
    setScore(0);
    setAllAnswered(false);
    setShowResults(false);
  };

  const getItemImage = (item: string) => {
    const imagePath = questions.imageMap[item];
    return imagePath ? getImageUrl(imagePath) : "";
  };

  const isAnswerCorrect = (rowIndex: number) => {
    return answers[rowIndex] === questions.patternAnswers[rowIndex];
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={questions.title} />
      <DNDContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col justify-between grow">
          {questions.patterns.map((pattern: string[], rowIndex: number) => (
            <div key={rowIndex} className="flex items-center gap-10">
              <div className="col-span-1 flex items-center font-bold text-xl">
                {rowIndex + 1}.
              </div>
              <div className="flex items-center justify-between grow">
                {pattern.map((item: string, colIndex: number) => (
                  <div key={`${rowIndex}-${colIndex}`} className="w-24 h-16">
                    <img
                      src={getItemImage(item)}
                      alt={item}
                      className="object-contain w-full h-full rounded-lg"
                    />
                  </div>
                ))}
              </div>
              <Droppable
                id={`dropzone-${rowIndex}`}
                isOverClassName="bg-lemon-400"
                className={`w-24 lg:mx-10 h-16 relative border-2 border-dashed flex items-center justify-center ${
                  showResults
                    ? isAnswerCorrect(rowIndex)
                      ? "bg-green-100 border-green-400"
                      : "bg-red-100 border-red-400"
                    : "bg-lemon-300/50 border-lemon-700"
                }`}
              >
                {answers[rowIndex] && (
                  <Draggable
                    id={`answer-${rowIndex}-${answers[rowIndex]}`}
                    className="w-full h-full cursor-move"
                  >
                    <img
                      src={getItemImage(answers[rowIndex]!)}
                      alt={answers[rowIndex]!}
                      className="object-contain rounded-lg w-full h-full"
                    />
                    {showResults && (
                      <div
                        className={cn("absolute -top-3 -right-3", {
                          "text-green-600 border-green-400":
                            isAnswerCorrect(rowIndex),
                          "text-red-600 border-red-400":
                            !isAnswerCorrect(rowIndex),
                        })}
                      >
                        {isAnswerCorrect(rowIndex) ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <X className="w-6 h-6" />
                        )}
                      </div>
                    )}
                  </Draggable>
                )}
              </Droppable>
              {/*{showResults && (
                <div className="ml-4 flex items-center">
                  {isAnswerCorrect(rowIndex) ? (
                    <div className="flex items-center text-green-600">
                      <span className="mr-2 text-xl">✓</span>
                      <span className="font-medium">Correct</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <span className="mr-2 text-xl">✗</span>
                      <span className="font-medium">Incorrect</span>
                    </div>
                  )}
                </div>
              )}*/}
            </div>
          ))}
        </div>

        {!showResults && (
          <div className="mt-8 flex justify-end space-x-10 bg-picton-blue-200 w-fit p-2 rounded-xl ml-auto">
            {questions.draggableItems.map((item: string) => (
              <Draggable
                key={item}
                id={item}
                className="w-24 h-16 flex items-center justify-center cursor-move"
              >
                <img
                  src={getItemImage(item)}
                  alt={item}
                  className="object-contain w-full h-full"
                />
              </Draggable>
            ))}
          </div>
        )}

        {showResults && (
          <ActivityResults
            score={score}
            total={questions.patterns.length}
            onRestart={resetActivity}
            className="mt-4"
          />
        )}

        <DragOverlay>
          {activeId ? (
            <div className="w-24 h-16 flex items-center justify-center opacity-80">
              <img
                src={getItemImage(
                  String(activeId).startsWith("answer-")
                    ? String(activeId).split("-")[2]
                    : activeId,
                )}
                alt={activeId}
                className="object-contain w-full h-full"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DNDContext>

      <ActivityResultsAlertDialog
        score={score}
        total={questions.patterns.length}
        open={allAnswered && !showResults}
        onOpenChange={(open) => {
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </div>
  );
};

export default PatternMatchingActivity;
