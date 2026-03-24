"use client";

import { CSS } from "@dnd-kit/utilities";
import React, { memo, useEffect, useState } from "react";
import {
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
} from "@dnd-kit/core";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import DNDContext from "@/components/layout/dnd-context";
import Droppable from "@/components/ui/dnd/droppable";
import OutDraggable from "@/components/ui/dnd/draggable";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { DraggableProps } from "@/components/ui/dnd/draggable";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useWindowSize } from "@/shared/hooks/use-window-size";

interface Option {
  id: string;
  content: string | { imageSrc: string; title: string };
  answer: string;
}

interface Question {
  id: string;
  category: "text" | "image" | "text-image";
  title: string;
  firstOption: {
    id: string;
    title: string;
    noOfAnswers: number;
  };
  thirdOption?: {
    id: string;
    title: string;
    noOfAnswers: number;
  };
  secondOption: {
    id: string;
    title: string;
    noOfAnswers: number;
  };
  questions: Option[];
}

// Helper function to render option content
const renderOptionContent = (item: Option) => {
  if (typeof item.content === "string") {
    return <span className="text-lg text-center p-4">{item.content}</span>;
  } else if ("imageSrc" in item.content) {
    return (
      <div className="p-4 mx-auto w-full h-full flex flex-col items-center text-center justify-center">
        <img
          src={item.content.imageSrc}
          alt={item.id}
          className={cn("object-contain mx-auto w-[200px] h-[100px]", {
            "h-[90px]": item.content.title,
          })}
        />

        {item.content.title && <p>{item.content.title}</p>}
      </div>
    );
  }
  return null;
};

const Draggable = memo(
  ({
    id,
    item,
    ...props
  }: DraggableProps & {
    item: Option;
  }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id,
    });

    return (
      <div
        {...props}
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={{
          touchAction: "none",
          transform: CSS.Transform.toString(transform),
        }}
        id={id}
      >
        {renderOptionContent(item)}
      </div>
    );
  },
);

Draggable.displayName = "Draggable";

type OptionWithIndex = Option & {
  index: number;
};

const Answer = ({
  answer,
  showResults = false,
  isCorrect = false,
  correctBox = "",
}: {
  answer: OptionWithIndex;
  showResults?: boolean;
  isCorrect?: boolean;
  correctBox?: string;
}) => {
  let content;
  if (typeof answer.content === "string") {
    content = answer.content;
  } else if ("imageSrc" in answer.content) {
    content = (
      <div className="p-4 mx-auto h-full flex flex-col items-center justify-center">
        <img
          src={answer.content.imageSrc}
          alt={answer.id}
          className={cn("object-contain mx-auto w-[200px] h-[100px]", {
            "h-[80px]": answer.content.title,
          })}
        />

        {answer.content.title && (
          <p className="text-center">{answer.content.title}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl h-32 text-center flex flex-col items-center justify-center relative",
        showResults
          ? isCorrect
            ? "bg-green-100 text-green-700 border-2 border-green-500"
            : "bg-red-100 text-red-700 border-2 border-red-500"
          : "bg-lemon-100 text-lemon-700",
      )}
    >
      {content}

      {showResults && !isCorrect && correctBox && (
        <div className="absolute bottom-1 right-1 left-1 flex justify-center items-center bg-white bg-opacity-80 rounded text-xs text-green-700 py-0.5 px-1">
          <span className="font-medium">Correct: {correctBox}</span>
        </div>
      )}

      {showResults && (
        <div
          className={cn(
            "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center",
            isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white",
          )}
        >
          {isCorrect ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 13L9 17L19 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};

const InWhichBoxActivity = ({
  questions,
  feedback,
}: {
  questions: Question;
  feedback?: FeedbackType;
}) => {
  const currentQuestion = questions;
  const { width } = useWindowSize();
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{
    first: OptionWithIndex[];
    second: OptionWithIndex[];
    third?: OptionWithIndex[];
  }>({
    first: [],
    second: [],
    third: [],
  });
  const [remainingOptions, setRemainingOptions] = useState<
    (OptionWithIndex | null)[]
  >(
    currentQuestion.questions.map((question, index) => ({
      ...question,
      index: index,
    })),
  );

  const { playSound } = useSoundEffects();

  useEffect(() => {
    const totalAnswers =
      answers.first.length +
      answers.second.length +
      (answers.third ? answers.third?.length : 0);

    if (totalAnswers === currentQuestion.questions.length) {
      let newScore = 0;

      currentQuestion.questions.forEach((question) => {
        const answer =
          answers.first.find((a) => a.id === question.id) ||
          answers.second.find((a) => a.id === question.id) ||
          answers.third?.find((a) => a.id === question.id);

        if (answer) {
          if (
            (answers.first.some((a) => a.id === answer.id) &&
              question.answer === currentQuestion.firstOption.id) ||
            (answers.second.some((a) => a.id === answer.id) &&
              question.answer === currentQuestion.secondOption.id) ||
            (answers.third?.some((a) => a.id === answer.id) &&
              question.answer === currentQuestion.thirdOption?.id)
          ) {
            newScore++;
          }
        }
      });

      setScore(newScore);
      setAllAnswered(true);
      playSound("success");
    }
  }, [
    currentQuestion.questions.length,
    answers,
    currentQuestion.firstOption.id,
    currentQuestion.secondOption.id,
    currentQuestion.thirdOption?.id,
    currentQuestion.questions,
  ]);

  const updateAnswers = (
    optionId: string,
    overIndex: number,
    optionKey: "first" | "second" | "third",
    overOptionKey: "first" | "second" | "third",
  ) => {
    const answer = answers[optionKey]?.find((answer) => answer.id === optionId);
    if (answer) {
      // Remove the answer from the original key
      const newOriginalAnswers =
        answers[optionKey]?.filter((answer) => answer.id !== optionId) || [];

      // Add the answer to the new key
      const newOverAnswers = [
        ...(answers[overOptionKey] || []),
        {
          ...answer,
          index: overIndex,
        },
      ];

      if (optionKey === overOptionKey) {
        const newAnswers = [...(answers[optionKey] || [])];
        newAnswers.splice(
          newAnswers.findIndex((answer) => answer.id === optionId),
          1,
        );
        newAnswers.splice(overIndex, 0, { ...answer, index: overIndex });
        setAnswers((prev) => ({
          ...prev,
          [optionKey]: newAnswers,
        }));
      } else {
        setAnswers((prev) => ({
          ...prev,
          [optionKey]: newOriginalAnswers,
          [overOptionKey]: newOverAnswers,
        }));
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && String(active.id).startsWith("draggable")) {
      const activeId = String(active.id).split("-")[1];
      const activeOptionKey = String(active.id).split("-")[2] as
        | "first"
        | "second"
        | "third";
      const overIndex = String(over.id).split("=")[1];
      const overOptionId = String(over.id).split("=")[0];
      const overOptionKey = String(over.id).split("=")[2] as
        | "first"
        | "second"
        | "third";
      const option = remainingOptions.find((option) => option?.id === activeId);

      if (option) {
        if (overOptionId === currentQuestion.firstOption.id) {
          setAnswers((prev) => ({
            ...prev,
            first: [
              ...prev.first,
              {
                ...option,
                index: Number(overIndex),
              },
            ],
          }));
        } else if (overOptionId === currentQuestion.secondOption.id) {
          setAnswers((prev) => ({
            ...prev,
            second: [
              ...prev.second,
              {
                ...option,
                index: Number(overIndex),
              },
            ],
          }));
        } else if (
          currentQuestion.thirdOption &&
          overOptionId === currentQuestion.thirdOption.id
        ) {
          setAnswers((prev) => ({
            ...prev,
            third: [
              ...(prev.third || []),
              {
                ...option,
                index: Number(overIndex),
              },
            ],
          }));
        }
        setRemainingOptions((options) =>
          // Replace the dragged option with a null value
          options.map((opt) => (opt?.id === activeId ? null : opt)),
        );
        playSound("click");
      } else {
        // handle when the user drags the answer to another answer
        if (overOptionId === currentQuestion.firstOption.id) {
          updateAnswers(
            activeId,
            Number(overIndex),
            activeOptionKey,
            overOptionKey,
          );
        } else if (overOptionId === currentQuestion.secondOption.id) {
          updateAnswers(
            activeId,
            Number(overIndex),
            activeOptionKey,
            overOptionKey,
          );
        } else if (
          currentQuestion.thirdOption &&
          overOptionId === currentQuestion.thirdOption.id
        ) {
          updateAnswers(
            activeId,
            Number(overIndex),
            activeOptionKey,
            overOptionKey,
          );
        }
      }
    }
  };

  const resetActivity = () => {
    setAllAnswered(false);
    setAnswers({
      first: [],
      second: [],
      third: [],
    });
    setRemainingOptions(
      shuffle(
        currentQuestion.questions.map((question, index) => ({
          ...question,
          index,
        })),
      ),
    );
    setScore(0);
    setShowResults(false);
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={currentQuestion.title} />

      <DNDContext
        removeScrollableModifier={width > 768 ? false : true}
        onDragStart={!showResults ? handleDragStart : undefined}
        onDragEnd={!showResults ? handleDragEnd : undefined}
      >
        <div>
          {!showResults && (
            <div className="overflow-x-auto md:overflow-x-visible">
              <div
                className="grid gap-1 mb-4"
                style={{
                  gridTemplateColumns: `repeat(${Math.ceil(
                    currentQuestion.questions.length / 2,
                  )}, minmax(150px, 1fr))`,
                  minWidth: "fit-content",
                }}
              >
                {Array.from({
                  length: currentQuestion.questions.length,
                }).map((_, index) =>
                  remainingOptions[index] ? (
                    <Draggable
                      key={index}
                      id={`draggable-${remainingOptions[index].id}`}
                      item={remainingOptions[index]}
                      className="bg-picton-blue-200 rounded-md z-10 h-32 flex flex-col items-center justify-center"
                    />
                  ) : (
                    <div key={index} className="bg-transparent h-32" />
                  ),
                )}
              </div>
            </div>
          )}
          <div
            className="grid gap-2 z-0"
            style={{
              gridTemplateColumns: `repeat(${
                width > 768 ? (currentQuestion.thirdOption ? 3 : 2) : 1
              }, minmax(0, 1fr))`,
            }}
          >
            <div className="w-full h-full rounded-xl flex flex-col bg-picton-blue-50 px-2 pb-1">
              <h3 className="text-center text-xl my-4">
                {currentQuestion.firstOption.title}
              </h3>
              <div
                className="grid gap-1 overflow-auto md:overflow-visible"
                style={{
                  gridTemplateColumns: `repeat(${
                    width > 768
                      ? Math.ceil(currentQuestion.firstOption.noOfAnswers / 2)
                      : 2
                  }, minmax(120px, 1fr))`,
                }}
              >
                {
                  // Droppable areas
                  Array.from({
                    length: currentQuestion.firstOption.noOfAnswers,
                  }).map((_, index) => {
                    const answer = answers.first.find(
                      (answer) => answer.index === index,
                    );

                    if (answer) {
                      // Determine if the answer is correct when showing results
                      const isCorrect =
                        showResults && feedback !== "none"
                          ? answer.answer === currentQuestion.firstOption.id
                          : false;

                      // Get the correct box title for wrong answers
                      const correctBox =
                        showResults &&
                        !isCorrect &&
                        feedback === "wrong-correct-answers"
                          ? answer.answer === currentQuestion.secondOption.id
                            ? currentQuestion.secondOption.title
                            : currentQuestion.thirdOption?.title || ""
                          : "";

                      return (
                        <OutDraggable
                          key={index}
                          id={`draggable-${answer.id}-first`}
                          className="rounded-xl h-32"
                          disabled={showResults}
                        >
                          <Answer
                            key={index}
                            answer={answer}
                            showResults={showResults && feedback !== "none"}
                            isCorrect={isCorrect}
                            correctBox={correctBox}
                          />
                        </OutDraggable>
                      );
                    } else {
                      return (
                        <Droppable
                          key={index}
                          id={`${currentQuestion.firstOption.id}=${index}=first`}
                          isOverClassName="bg-lemon-50"
                          className="bg-picton-blue-100 rounded-xl w-full h-32"
                          disabled={showResults}
                        />
                      );
                    }
                  })
                }
              </div>
            </div>
            <div className="w-full h-full rounded-xl flex flex-col bg-picton-blue-50 px-2 pb-1">
              <h3 className="text-center text-xl my-4">
                {currentQuestion.secondOption.title}
              </h3>
              <div
                className="grid gap-1 overflow-auto md:overflow-visible"
                style={{
                  gridTemplateColumns: `repeat(${
                    width > 768
                      ? Math.ceil(currentQuestion.secondOption.noOfAnswers / 2)
                      : 2
                  }, minmax(120px, 1fr))`,
                }}
              >
                {
                  // Droppable areas
                  Array.from({
                    length: currentQuestion.secondOption.noOfAnswers,
                  }).map((_, index) => {
                    const answer = answers.second.find(
                      (answer) => answer.index === index,
                    );

                    if (answer) {
                      // Determine if the answer is correct when showing results
                      const isCorrect =
                        showResults && feedback !== "none"
                          ? answer.answer === currentQuestion.secondOption.id
                          : false;

                      // Get the correct box title for wrong answers
                      const correctBox =
                        showResults &&
                        !isCorrect &&
                        feedback === "wrong-correct-answers"
                          ? answer.answer === currentQuestion.firstOption.id
                            ? currentQuestion.firstOption.title
                            : currentQuestion.thirdOption?.title || ""
                          : "";

                      return (
                        <OutDraggable
                          key={index}
                          id={`draggable-${answer.id}-second`}
                          className="rounded-xl h-32"
                          disabled={showResults}
                        >
                          <Answer
                            key={index}
                            answer={answer}
                            showResults={showResults && feedback !== "none"}
                            isCorrect={isCorrect}
                            correctBox={correctBox}
                          />
                        </OutDraggable>
                      );
                    } else {
                      return (
                        <Droppable
                          key={index}
                          id={`${currentQuestion.secondOption.id}=${index}=second`}
                          isOverClassName="bg-lemon-50"
                          className="bg-picton-blue-100 rounded-xl h-32"
                          disabled={showResults}
                        />
                      );
                    }
                  })
                }
              </div>
            </div>
            {currentQuestion.thirdOption && (
              <div className="w-full h-full rounded-xl flex flex-col bg-picton-blue-50 px-2 pb-1">
                <h3 className="text-center text-xl my-4">
                  {currentQuestion.thirdOption.title}
                </h3>
                <div
                  className="grid gap-1 overflow-auto md:overflow-visible"
                  style={{
                    gridTemplateColumns: `repeat(${Math.ceil(
                      currentQuestion.thirdOption.noOfAnswers / 2,
                    )}, minmax(120px, 1fr))`,
                  }}
                >
                  {
                    // Droppable areas
                    Array.from({
                      length: currentQuestion.thirdOption.noOfAnswers,
                    }).map((_, index) => {
                      const answer = answers.third?.find(
                        (answer) => answer.index === index,
                      );

                      if (answer) {
                        // Determine if the answer is correct when showing results
                        const isCorrect =
                          showResults && feedback !== "none"
                            ? answer.answer === currentQuestion.thirdOption?.id
                            : false;

                        // Get the correct box title for wrong answers
                        const correctBox =
                          showResults &&
                          !isCorrect &&
                          feedback === "wrong-correct-answers"
                            ? answer.answer === currentQuestion.firstOption.id
                              ? currentQuestion.firstOption.title
                              : currentQuestion.secondOption.title
                            : "";

                        return (
                          <OutDraggable
                            key={index}
                            id={`draggable-${answer.id}-third`}
                            className="rounded-xl h-32"
                            disabled={showResults}
                          >
                            <Answer
                              key={index}
                              answer={answer}
                              showResults={showResults && feedback !== "none"}
                              isCorrect={isCorrect}
                              correctBox={correctBox}
                            />
                          </OutDraggable>
                        );
                      }

                      return (
                        <Droppable
                          key={index}
                          id={`${currentQuestion.thirdOption?.id}=${index}=third`}
                          isOverClassName="bg-lemon-50"
                          className="bg-picton-blue-100 rounded-xl h-32"
                          disabled={showResults}
                        />
                      );
                    })
                  }
                </div>
              </div>
            )}
          </div>
        </div>
        <DragOverlay dropAnimation={null} zIndex={9999}>
          {activeId
            ? (() => {
                // Check if it's from remaining options
                const remainingOption = remainingOptions.find(
                  (opt) => opt && `draggable-${opt.id}` === activeId,
                );
                if (remainingOption) {
                  return (
                    <div className="bg-picton-blue-200 rounded-md h-32 flex flex-col items-center justify-center cursor-grabbing shadow-2xl z-[9999]">
                      {renderOptionContent(remainingOption)}
                    </div>
                  );
                }

                // Check if it's from answers
                const allAnswers = [
                  ...answers.first,
                  ...answers.second,
                  ...(answers.third || []),
                ];
                const answerItem = allAnswers.find((ans) =>
                  activeId.includes(ans.id),
                );

                if (answerItem) {
                  return (
                    <div className="rounded-xl h-32 cursor-grabbing shadow-2xl z-[9999]">
                      <Answer answer={answerItem} />
                    </div>
                  );
                }

                return null;
              })()
            : null}
        </DragOverlay>
      </DNDContext>

      {showResults && (
        <div className="w-full mt-4 px-4">
          <ActivityResults
            score={score}
            total={currentQuestion.questions.length}
            onRestart={resetActivity}
          />
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={currentQuestion.questions.length}
        open={allAnswered}
        onOpenChange={(open) => {
          if (!open) {
            if (feedback === "none") {
              resetActivity();
            } else {
              setShowResults(true);
            }
            setAllAnswered(false);
          }
        }}
      />
    </div>
  );
};

export default InWhichBoxActivity;
