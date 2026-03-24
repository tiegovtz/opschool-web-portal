import { useEffect, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import Draggable from "../../../../../tie_open_school_primary_frontend/components/ui/dnd/draggable";
import Droppable from "../../../../../tie_open_school_primary_frontend/components/ui/dnd/droppable";
import DNDContext from "../../../../../tie_open_school_primary_frontend/components/layout/dnd-context";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

type TQuestion = {
  id: string;
  name: string;
  description: string;
  image?: string;
  correctOptions: string[];
};

type TCompleteMatrixActivityProps = {
  questions: {
    title: string;
    titles: string[];
    options: string[];
    questions: TQuestion[];
  };
  feedback?: FeedbackType;
};

const CompleteMatrixActivity = ({
  questions,
  feedback = "none",
}: TCompleteMatrixActivityProps) => {
  const [droppedItems, setDroppedItems] = useState<Record<string, string[]>>(
    questions.questions.reduce((acc, question) => {
      acc[question.id] = [];
      return acc;
    }, {} as Record<string, string[]>)
  );
  const [availableOptions, setAvailableOptions] = useState<string[]>(
    questions.options
  );
  const [score, setScore] = useState({
    correct: 0,
    total: questions.options.length,
  });
  const [allAnswered, setAllAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const { playSound } = useSoundEffects();

  useEffect(() => {
    if (availableOptions.length === 0) {
      const correctAnswers = questions.questions.reduce((acc, question) => {
        const correctCount = question.correctOptions.filter((option) =>
          droppedItems[question.id].includes(option)
        ).length;
        return acc + correctCount;
      }, 0);

      setScore({ correct: correctAnswers, total: questions.options.length });
      playSound("success");
      setAllAnswered(true);
    }
  }, [availableOptions, droppedItems, questions.questions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const droppableId = (over.id as string).split("%")[0];
    const dropZoneIndex = parseInt((over.id as string).split("%")[1]);
    const instructionId = active.id as string;
    const instruction = instructionId;

    // Check if the item is already in a droppable area
    let sourceDroppableId = null;
    for (const [id, items] of Object.entries(droppedItems)) {
      const index = items.indexOf(instruction);
      if (index !== -1) {
        sourceDroppableId = id;
        // Remove from original position
        setDroppedItems((prev) => ({
          ...prev,
          [id]: prev[id].filter((item) => item !== instruction),
        }));
        break;
      }
    }

    // If item wasn't previously dropped, remove it from available options
    if (!sourceDroppableId) {
      setAvailableOptions((prev) =>
        prev.filter((item) => item !== instruction)
      );
    }

    // Add the instruction to the new drop area
    setDroppedItems((prev) => {
      const updatedItems = [...prev[droppableId]];

      // If the drop zone already has an item, we need to handle replacement
      if (
        updatedItems[dropZoneIndex] &&
        updatedItems[dropZoneIndex] !== instruction
      ) {
        // Move the displaced item back to available options if it's not already being moved
        if (!sourceDroppableId) {
          setAvailableOptions((prev) => [...prev, updatedItems[dropZoneIndex]]);
        }
      }

      // Update the specific position with the new item
      updatedItems[dropZoneIndex] = instruction;

      return {
        ...prev,
        [droppableId]: updatedItems,
      };
    });

    playSound("click");
  };

  const resetActivity = () => {
    setDroppedItems(
      questions.questions.reduce((acc, question) => {
        acc[question.id] = [];
        return acc;
      }, {} as Record<string, string[]>)
    );
    setAvailableOptions(shuffle(questions.options));
    setScore({ correct: 0, total: questions.options.length });
    setAllAnswered(false);
    setShowFeedback(false);
    setShowCorrectAnswers(false);
  };

  // Helper function to check if an answer is correct
  const isCorrectAnswer = (questionId: string, option: string) => {
    const question = questions.questions.find((q) => q.id === questionId);
    return question?.correctOptions.includes(option) || false;
  };

  // Get the correct options for a question
  const getCorrectCategory = (option: string) => {
    for (const question of questions.questions) {
      if (question.correctOptions.includes(option)) {
        return question.name;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={questions.title} />

      <div>
        <div className="mb-6">
          <DNDContext onDragEnd={handleDragEnd}>
            <div className="bg-white rounded-lg">
              <div className="grid grid-cols-12 gap-4 bg-picton-blue-200 rounded-t-lg text-picton-blue-700 p-2 font-bold">
                <div className="col-span-3 text-center">
                  {questions.titles[0]}
                </div>
                <div className="col-span-4 text-center">
                  {questions.titles[1]}
                </div>
                <div className="col-span-5 text-center">
                  {questions.titles[2]}
                </div>
              </div>

              <div className="px-6">
                {questions.questions.map((question, index) => (
                  <div className="border-b border-gray-200 py-4" key={index}>
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3 flex gap-4 items-center">
                        <div className="text-center">{index + 1}.</div>
                        <div className={question.image ? "mx-auto" : "my-10"}>
                          {question.image && (
                            <div className="flex justify-center max-h-[210px]">
                              <img
                                src={question.image}
                                alt={question.name}
                                className="w-full h-full max-w-[210px] max-h-[210px] object-contain"
                              />
                            </div>
                          )}
                          {question.name && (
                            <div
                              className={cn("text-lg", {
                                "text-center mt-2 font-medium": question.image,
                              })}
                            >
                              {question.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-4 text-lg whitespace-pre-line">
                        {question.description}
                      </div>
                      <div className="col-span-5">
                        <div className="flex flex-col gap-2 justify-center">
                          {Array.from({
                            length: question.correctOptions.length,
                          }).map((_, idx) => {
                            // Check if this slot already has an item
                            const hasItem = !!droppedItems[question.id][idx];
                            const option = droppedItems[question.id][idx];
                            const isCorrect =
                              option && isCorrectAnswer(question.id, option);

                            // Determine background color based on feedback mode
                            let bgColor = "bg-picton-blue-200";
                            let textColor = "text-picton-blue-700";

                            if (hasItem) {
                              if (!showFeedback) {
                                bgColor = "bg-lemon-200";
                                textColor = "text-lemon-700";
                              } else {
                                bgColor = isCorrect
                                  ? "bg-green-200"
                                  : "bg-red-200";
                                textColor = isCorrect
                                  ? "text-green-700"
                                  : "text-red-700";
                              }
                            }

                            // Get the correct option for this index
                            const correctOption = question.correctOptions[idx];

                            return hasItem ? (
                              // If there's already an item
                              <Draggable
                                key={idx}
                                id={option}
                                className={`w-full min-h-10 h-full flex items-center px-4 text-lg rounded-lg ${bgColor} ${textColor}`}
                                disabled={showFeedback}
                              >
                                {option}
                                {showFeedback &&
                                  !isCorrect &&
                                  feedback === "wrong-correct-answers" &&
                                  question.name && (
                                    <span className="ml-2 text-green-700 font-semibold">
                                      → {getCorrectCategory(option)}
                                    </span>
                                  )}
                              </Draggable>
                            ) : showCorrectAnswers ? (
                              // If showing correct answers and no item
                              <div key={idx} className="w-full h-10">
                                <div
                                  className={`w-full h-full flex items-center px-4 text-lg rounded-lg bg-green-200 text-green-700`}
                                >
                                  {correctOption}
                                </div>
                              </div>
                            ) : (
                              // If no item yet and not showing correct answers
                              <Droppable
                                key={idx}
                                id={`${question.id}%${idx}`}
                                isOverClassName="bg-lemon-200"
                                className="flex items-center justify-center w-full h-10 bg-picton-blue-200 rounded-lg"
                                disabled={showFeedback}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableOptions.map((option, i) => (
                  <Draggable key={i} id={option} disabled={showFeedback}>
                    <div className="flex gap-4 text-center rounded min-w-36 text-lg px-4 min-h-10 items-center text-picton-blue-700 bg-picton-blue-200">
                      <span>{option}</span>
                    </div>
                  </Draggable>
                ))}
              </div>
            </div>
          </DNDContext>
        </div>
      </div>

      {showFeedback && (
        <div className="mt-4">
          <ActivityResults
            score={score.correct}
            total={score.total}
            onRestart={resetActivity}
          />
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score.correct}
        total={score.total}
        open={allAnswered}
        onOpenChange={(open) => {
          if (!open) {
            if (feedback === "none") {
              resetActivity();
            } else if (feedback === "wrong-correct") {
              setShowFeedback(true);
              setAllAnswered(false);
            } else if (feedback === "wrong-correct-answers") {
              setShowFeedback(true);
              setShowCorrectAnswers(true);
              setAllAnswered(false);
            }
          }
        }}
      />
    </div>
  );
};

export default CompleteMatrixActivity;
