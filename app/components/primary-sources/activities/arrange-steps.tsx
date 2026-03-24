"use client";

import { useEffect, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Check, X, ArrowDown } from "lucide-react";

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
import LeftNotesWithImages from "../../../../../tie_open_school_primary_frontend/components/templates/left-notes-with-images";

type TStep = {
  id: string;
  text: string;
  image?: string;
};

type TArrangeStepsQuestion = {
  title: string;
  notes: string;
  notesImage?: string;
  steps: TStep[];
};

type ArrangeStepsProps = {
  questions: TArrangeStepsQuestion;
  feedback?: FeedbackType;
};

const ArrangeSteps = ({
  questions: serverQuestions,
  feedback = "wrong-correct-answers",
}: ArrangeStepsProps) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [correctItems, setCorrectItems] = useState<string[]>([]);
  const [steps, setSteps] = useState<TStep[]>([]);
  const [arrangedSteps, setArrangedSteps] = useState<Array<TStep | "">>(
    Array(serverQuestions.steps.length).fill("")
  );

  const { playSound } = useSoundEffects();

  // Initialize the activity when component mounts
  useEffect(() => {
    initializeActivity();
  }, []);

  // Initialize or reset the activity
  const initializeActivity = () => {
    // Shuffle the steps for the activity
    setSteps(shuffle([...serverQuestions.steps]));
    setArrangedSteps(Array(serverQuestions.steps.length).fill(""));
    setCorrectItems([]);
    setShowResults(false);
    setScore(0);
    setAllAnswered(false);
  };

  useEffect(() => {
    if (arrangedSteps.every((step) => step !== "")) {
      const correctIds: string[] = [];

      // Check if steps are in the correct order
      arrangedSteps.forEach((step, i) => {
        if (
          typeof step !== "string" &&
          step.id === serverQuestions.steps[i].id
        ) {
          correctIds.push(step.id);
        }
      });

      setScore(correctIds.length);
      setCorrectItems(correctIds);
      playSound("success");
      setAllAnswered(true);
    } else {
      setAllAnswered(false);
    }
  }, [arrangedSteps]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    let activeId: string, activeIndex: string;

    if (String(active.id).includes("%")) {
      activeId = String(active.id).split("%")[0];
      activeIndex = String(active.id).split("%")[1];
    } else {
      activeId = String(active.id);
      activeIndex = "";
    }

    const overIndex = Number(String(over.id).split("%")[1]);
    const activeStep = serverQuestions.steps.find(
      (step) => step.id === activeId
    );

    if (!activeStep) return;

    setArrangedSteps((prev) => {
      const newArrangedSteps = [...prev];
      newArrangedSteps[overIndex] = activeStep;
      return newArrangedSteps;
    });

    playSound("click");

    // if activeIndex is not empty, then remove the item from its initial position
    if (activeIndex) {
      setArrangedSteps((prev) => {
        const newArrangedSteps = [...prev];
        newArrangedSteps[Number(activeIndex)] = "";
        return newArrangedSteps;
      });
    }

    setSteps((prev) => prev.filter((step) => step.id !== activeId));
  };

  const iconVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", damping: 10 },
    },
  };

  const renderContent = (step: TStep) => {
    return step.image ? (
      <div className="w-fit h-full flex gap-4 items-center">
        <img
          src={step.image}
          alt={step.text}
          className="max-w-36 h-full object-contain"
        />
        <p>{step.text}</p>
      </div>
    ) : (
      step.text
    );
  };

  const resetActivity = () => {
    initializeActivity();
  };

  const isCorrect = (step: TStep, index: number) => {
    if (!showResults) return false;
    return step.id === serverQuestions.steps[index].id;
  };

  const renderResultIcon = (step: TStep, index: number) => {
    if (!showResults) return null;

    return isCorrect(step, index) ? (
      <motion.div
        className="absolute top-2 right-2"
        variants={iconVariants}
        initial="initial"
        animate="animate"
      >
        <Check className="text-green-600 h-8 w-8" />
      </motion.div>
    ) : (
      <motion.div
        className="absolute top-2 right-2"
        variants={iconVariants}
        initial="initial"
        animate="animate"
      >
        <X className="text-red-600 h-8 w-8" />
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={serverQuestions.title} />

      <div className="flex flex-col gap-4">
        <DNDContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6">
            {/* Left side - Notes */}
            <div className="w-1/2">
              <LeftNotesWithImages
                notes={serverQuestions.notes}
                image={serverQuestions.notesImage}
              />
            </div>

            {/* Right side - Draggable area */}
            <div className="w-1/2">
              <div className="flex flex-col gap-3 relative h-[600px]">
                {arrangedSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 h-full">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-picton-blue-100 flex items-center justify-center text-picton-blue-700 font-bold text-lg border-2 border-picton-blue-300">
                      {i + 1}
                    </div>

                    <div className="flex-grow h-full">
                      {step === "" ? (
                        <Droppable
                          id={`step%${i}`}
                          isOverClassName="bg-lemon-100"
                          className="bg-white border h-full border-picton-blue-200 rounded flex items-center justify-center"
                        />
                      ) : showResults ? (
                        <div
                          className={`${
                            isCorrect(step, i)
                              ? "bg-green-200 text-green-700"
                              : "bg-red-200 text-red-700"
                          } flex items-center gap-2 h-full border px-4 py-2 border-picton-blue-200 rounded relative`}
                        >
                          <span
                            className={cn({
                              "line-through": !isCorrect(step, i),
                            })}
                          >
                            {step.text}
                          </span>
                          {!isCorrect(step, i) && (
                            <div>
                              {serverQuestions.steps[i] && (
                                <span className="text-green-700">
                                  {serverQuestions.steps[i].text}
                                </span>
                              )}
                            </div>
                          )}
                          {renderResultIcon(step, i)}
                        </div>
                      ) : (
                        <Draggable
                          key={i}
                          id={`${step.id}%${i}`}
                          className="bg-lemon-200 text-lemon-700 flex items-center h-full border px-4 py-2 border-picton-blue-200 rounded relative"
                        >
                          <div className="flex items-center gap-2">
                            {renderContent(step)}
                          </div>
                        </Draggable>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {!showResults && (
            <div className="relative h-[100px] flex flex-wrap gap-2 mt-6">
              {steps.map((step, i) => (
                <Draggable
                  key={step.id}
                  id={step.id}
                  className="absolute bg-lemon-100 h-full text-lemon-700 flex items-center border px-4 py-2 border-lemon-300 rounded w-1/2 text-lg flex-grow"
                  style={{
                    left: `${i * 50}px`,
                  }}
                >
                  {renderContent(step)}
                </Draggable>
              ))}
            </div>
          )}
        </DNDContext>

        {showResults && (
          <div className="mt-4">
            <ActivityResults
              score={score}
              total={serverQuestions.steps.length}
              onRestart={resetActivity}
            />
          </div>
        )}

        <ActivityResultsAlertDialog
          score={score}
          total={serverQuestions.steps.length}
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
    </div>
  );
};

export default ArrangeSteps;
