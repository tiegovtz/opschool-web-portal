"use client";

import { useEffect, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";

// Local imports
import { shuffle } from "@/lib/utils";
import Draggable from "../../../../../tie_open_school_primary_frontend/components/ui/dnd/draggable";
import Droppable from "../../../../../tie_open_school_primary_frontend/components/ui/dnd/droppable";
import DNDContext from "../../../../../tie_open_school_primary_frontend/components/layout/dnd-context";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";
import { useWindowSize } from "@/shared/hooks/use-window-size";

type TListItem = {
  id: string;
  text?: string;
  image?: string;
};

type TDialogDifferencesQuestion = {
  title: string;
  fontSize?: string;
  leftLabel: string;
  rightLabel: string;
  lockSide: "left" | "right" | null;
  items: {
    id: string;
    text?: string;
    image?: string;
    side: "left" | "right";
  }[];
};

type DialogDifferencesProps = {
  questions: TDialogDifferencesQuestion;
  feedback?: FeedbackType;
};

const fillList = (
  side: "left" | "right",
  questions: TDialogDifferencesQuestion,
) => {
  if (questions.lockSide === "left" && side === "left") {
    return questions.items.filter((item) => item.side === "left" && item);
  } else if (questions.lockSide === "right" && side === "right") {
    return questions.items.filter((item) => item.side === "right" && item);
  }

  return Array(questions.items.length / 2).fill("");
};

const DialogDifferences = ({
  questions: serverQuestions,
  feedback = "wrong-correct-answers",
}: DialogDifferencesProps) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [correctItems, setCorrectItems] = useState<string[]>([]);
  const [questions, setQuestions] = useState(
    shuffle(
      serverQuestions.items.filter(
        (item) => item.side !== serverQuestions.lockSide,
      ),
    ),
  );
  const [listA, setListA] = useState<
    Array<(TListItem & { side: "left" | "right" }) | "">
  >(fillList("left", serverQuestions));
  const [listB, setListB] = useState<
    Array<(TListItem & { side: "left" | "right" }) | "">
  >(fillList("right", serverQuestions));

  const { width } = useWindowSize();
  const { playSound } = useSoundEffects();

  useEffect(() => {
    if (
      listA.every((item) => item !== "") &&
      listB.every((item) => item !== "")
    ) {
      const correctIds: string[] = [];

      if (!serverQuestions.lockSide) {
        // Check both sides
        listA.forEach((item) => {
          if (typeof item !== "string" && item.side === "left") {
            correctIds.push(item.id);
          }
        });

        listB.forEach((item) => {
          if (typeof item !== "string" && item.side === "right") {
            correctIds.push(item.id);
          }
        });

        setScore(correctIds.length);
      } else {
        // If one side is locked, check the other side
        const correctOrder = serverQuestions.items.filter(
          (item) => item.side !== serverQuestions.lockSide,
        );

        const correctList = serverQuestions.lockSide === "left" ? listB : listA;

        correctOrder.forEach((item, i) => {
          if (
            typeof correctList[i] !== "string" &&
            item.id === correctList[i].id
          ) {
            correctIds.push(item.id);
          }
        });

        setScore(correctIds.length);
      }

      setCorrectItems(correctIds);
      playSound("success");
      setAllAnswered(true);
    } else {
      setAllAnswered(false);
    }
  }, [listA, listB]);

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

    const overSide = String(over.id).split("%")[0];
    const overIndex = Number(String(over.id).split("%")[1]);

    const activeItem = serverQuestions.items.find(
      (item) => Number(item.id) === Number(activeId),
    );

    if (!activeItem) return;

    if (overSide === "left") {
      setListA((prev) => {
        const newList = [...prev];
        newList[overIndex] = activeItem;
        return newList;
      });
    } else {
      setListB((prev) => {
        const newList = [...prev];
        newList[overIndex] = activeItem;
        return newList;
      });
    }

    playSound("click");

    // if activeIndex is not empty, then remove the item from the its initial list
    if (activeIndex) {
      if (String(active.id).split("%")[2] === "left") {
        setListA((prev) => {
          const newList = [...prev];
          newList[Number(activeIndex)] = "";
          return newList;
        });
      } else {
        setListB((prev) => {
          const newList = [...prev];
          newList[Number(activeIndex)] = "";
          return newList;
        });
      }
    }

    setQuestions((prev) =>
      prev.filter((item) => Number(item.id) !== Number(activeId)),
    );
  };

  const iconVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", damping: 10 },
    },
  };

  const renderContent = (item: TListItem) => {
    return item.image ? (
      <div className="w-fit h-full flex flex-col md:flex-row gap-1 md:gap-4 md:items-center">
        <img
          src={item.image as string}
          alt={item.text || ""}
          className="max-w-48 w-full h-full object-contain"
        />
        <p className="text-sm sm:text-base">{item.text}</p>
      </div>
    ) : (
      <span
        style={{
          // truncate text if over 5 lines
          display: "-webkit-box",
          WebkitLineClamp: 5,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {item.text}
      </span>
    );
  };

  const resetActivity = () => {
    setShowResults(false);
    setScore(0);
    setQuestions(
      shuffle(
        serverQuestions.items.filter(
          (item) => item.side !== serverQuestions.lockSide,
        ),
      ),
    );
    setListA(fillList("left", serverQuestions));
    setListB(fillList("right", serverQuestions));
    setCorrectItems([]);
  };

  const isCorrect = (item: TListItem & { side: "left" | "right" }) => {
    if (!showResults) return false;
    return correctItems.includes(item.id);
  };

  const renderResultIcon = (item: TListItem & { side: "left" | "right" }) => {
    if (!showResults) return null;

    return isCorrect(item) ? (
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

      <div
        className="flex flex-col gap-4"
        style={{
          fontSize: serverQuestions.fontSize
            ? `${serverQuestions.fontSize}px`
            : "20px",
        }}
      >
        <DNDContext onDragEnd={handleDragEnd}>
          <div className="flex gap-1 md:gap-4">
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="bg-picton-blue-200 md:p-6 flex items-center justify-center md:[writing-mode:vertical-rl] md:rotate-180 max-h-[707px] overflow-hidden">
                <span className="line-clamp-2 overflow-ellipsis text-center">
                  {serverQuestions.leftLabel}
                </span>
              </div>
              <div className="w-full flex flex-col justify-between md:gap-2">
                {listA.map((item, i) => {
                  if (serverQuestions.lockSide === "left") {
                    return (
                      <div
                        key={i}
                        className="bg-white px-4 py-2 flex items-center h-[135px] border border-picton-blue-200 rounded"
                      >
                        {item && renderContent(item)}
                      </div>
                    );
                  }

                  if (item === "") {
                    return (
                      <Droppable
                        key={i}
                        id={`left%${i}`}
                        isOverClassName="bg-lemon-100"
                        className="bg-white border h-[135px] border-picton-blue-200 rounded"
                      >
                        {item}
                      </Droppable>
                    );
                  }

                  return showResults ? (
                    <div
                      key={i}
                      className={`${
                        isCorrect(item)
                          ? "bg-green-200 text-green-700"
                          : "bg-red-200 text-red-700"
                      } flex items-center h-[135px] text-base md:text-[length:inherit] border px-2 md:px-4 md:py-2 border-picton-blue-200 rounded relative`}
                    >
                      {item && renderContent(item)}
                      {renderResultIcon(item)}
                    </div>
                  ) : (
                    <Draggable
                      key={i}
                      id={`${item.id}%${i}%left`}
                      className="bg-lemon-200 text-lemon-700 flex items-center h-[135px] text-base md:text-[length:inherit] border px-2 md:px-4 md:py-2 border-picton-blue-200 rounded relative"
                    >
                      {item && renderContent(item)}
                    </Draggable>
                  );
                })}
              </div>
            </div>
            {/*<div className="flex-1 flex gap-2">
            </div>*/}
            <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
              <div className="w-full flex flex-col justify-between md:gap-2">
                {listB.map((item, i) => {
                  if (serverQuestions.lockSide === "right") {
                    return (
                      <div
                        key={i}
                        className="bg-white px-4 py-2 flex items-center h-[135px] border border-picton-blue-200 rounded"
                      >
                        {item && renderContent(item)}
                      </div>
                    );
                  }

                  if (item === "") {
                    return (
                      <Droppable
                        key={i}
                        id={`right%${i}`}
                        isOverClassName="bg-lemon-100"
                        className="bg-white h-[135px] border border-picton-blue-200 rounded"
                      >
                        {item}
                      </Droppable>
                    );
                  }

                  return showResults ? (
                    <div
                      key={i}
                      className={`${
                        isCorrect(item)
                          ? "bg-green-200 text-green-700"
                          : "bg-red-200 text-red-700"
                      } flex items-center h-[135px] text-base md:text-[length:inherit] border px-2 md:px-4 md:py-2 border-picton-blue-200 rounded relative`}
                    >
                      {item && renderContent(item)}
                      {renderResultIcon(item)}
                    </div>
                  ) : (
                    <Draggable
                      key={i}
                      id={`${item.id}%${i}%right`}
                      className={`${
                        showResults
                          ? isCorrect(item)
                            ? "bg-green-200 text-green-700"
                            : "bg-red-200 text-red-700"
                          : "bg-lemon-200 text-lemon-700"
                      } flex items-center h-[135px] text-base md:text-[length:inherit] border px-2 md:px-4 md:py-2 border-picton-blue-200 rounded relative`}
                    >
                      {item && renderContent(item)}
                      {renderResultIcon(item)}
                    </Draggable>
                  );
                })}
              </div>
              <div className="bg-picton-blue-200 md:p-6 flex items-center justify-center md:[writing-mode:vertical-rl] md:rotate-180 max-h-[707px] overflow-hidden">
                <span className="line-clamp-2 overflow-ellipsis text-center">
                  {serverQuestions.rightLabel}
                </span>
              </div>
            </div>
          </div>
          {!showResults && (
            <div className="relative h-[130px]">
              {
                // render the draggable items
                questions.map((item, i) => (
                  <Draggable
                    key={item.id}
                    id={item.id}
                    className="bg-picton-blue-200 text-picton-blue-700 flex text-base md:text-[length:inherit] items-center w-1/2 border px-4 py-2 border-picton-blue-300 rounded h-[135px] absolute"
                    style={{
                      left: `${i * (width > 768 ? 50 : 30)}px`,
                    }}
                  >
                    {renderContent(item)}
                  </Draggable>
                ))
              }
            </div>
          )}
        </DNDContext>

        {showResults && (
          <div className="mt-4">
            <ActivityResults
              score={score}
              total={
                serverQuestions.items.filter(
                  (item) => item.side !== serverQuestions.lockSide,
                ).length
              }
              onRestart={resetActivity}
            />
          </div>
        )}

        <ActivityResultsAlertDialog
          score={score}
          total={
            serverQuestions.items.filter(
              (item) => item.side !== serverQuestions.lockSide,
            ).length
          }
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

export default DialogDifferences;
