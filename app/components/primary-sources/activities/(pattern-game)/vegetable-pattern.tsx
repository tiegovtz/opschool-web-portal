"use client";

import Image from "next/image";
import { FC, useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";

// Local imports
import Droppable from "@/components/ui/dnd/droppable";
import Draggable from "@/components/ui/dnd/draggable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Images assets
import onion from "@/assets/activities-data/onion.png";
import tomato from "@/assets/activities-data/tomato.png";
import cabbage from "@/assets/activities-data/cabbage.png";
import brocolli from "@/assets/activities-data/brocolli.png";
import cucumber from "@/assets/activities-data/cucumber.png";
import green_pepper from "@/assets/activities-data/green-pepper.png";

type Vegetable =
  | "broccoli"
  | "pepper"
  | "onion"
  | "tomato"
  | "cucumber"
  | "cabbage";

const patterns: Vegetable[][] = [
  [
    "broccoli",
    "pepper",
    "onion",
    "broccoli",
    "pepper",
    "onion",
    "broccoli",
    "pepper",
    "onion",
  ],
  [
    "tomato",
    "tomato",
    "cucumber",
    "cucumber",
    "tomato",
    "tomato",
    "cucumber",
    "cucumber",
    "tomato",
  ],
  [
    "cabbage",
    "cabbage",
    "cabbage",
    "pepper",
    "pepper",
    "pepper",
    "cabbage",
    "cabbage",
    "cabbage",
  ],
  [
    "cucumber",
    "cucumber",
    "tomato",
    "tomato",
    "broccoli",
    "broccoli",
    "cucumber",
    "cucumber",
    "tomato",
  ],
  [
    "tomato",
    "onion",
    "tomato",
    "onion",
    "tomato",
    "onion",
    "tomato",
    "onion",
    "tomato",
  ],
  [
    "tomato",
    "cucumber",
    "broccoli",
    "pepper",
    "tomato",
    "cucumber",
    "broccoli",
    "pepper",
    "tomato",
  ],
];

const patternAnswers: Vegetable[] = [
  "broccoli",
  "tomato",
  "pepper",
  "tomato",
  "onion",
  "cucumber",
];

const draggableVegetables: Vegetable[] = [
  "tomato",
  "cucumber",
  "broccoli",
  "pepper",
  "onion",
  "cabbage",
];

const getVegetableImage = (vegetable: Vegetable) => {
  switch (vegetable) {
    case "broccoli":
      return brocolli;
    case "pepper":
      return green_pepper;
    case "onion":
      return onion;
    case "tomato":
      return tomato;
    case "cucumber":
      return cucumber;
    case "cabbage":
      return cabbage;
  }
};

const VegetablePatternGame: FC = () => {
  const [answers, setAnswers] = useState<(Vegetable | null)[]>(
    Array(6).fill(null)
  );
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [activeId, setActiveId] = useState<Vegetable | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  useEffect(() => {
    if (answers.every((answer) => answer !== null)) setAllAnswered(true);
  }, [answers]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Vegetable | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && String(over.id).startsWith("dropzone-")) {
      const dropzoneIndex = parseInt(String(over.id).split("-")[1]);
      const newAnswers = [...answers];
      newAnswers[dropzoneIndex] = active.id as Vegetable;
      setAnswers(newAnswers);

      // Validate answer
      if (newAnswers[dropzoneIndex] === patternAnswers[dropzoneIndex]) {
        setScore(score + 1);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl text-center font-bold mb-4">
        Fill in the next vegetable in the pattern:
      </h1>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col justify-between grow">
          {patterns.map((pattern, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-10">
              <div className="col-span-1 flex items-center font-bold">
                {rowIndex + 1}.
              </div>
              <div className="flex items-center justify-between grow">
                {pattern.map((vegetable, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="w-12 h-12 flex items-center justify-center"
                  >
                    <Image
                      src={getVegetableImage(vegetable)}
                      alt={vegetable}
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
              <Droppable
                id={`dropzone-${rowIndex}`}
                isOverClassName="bg-lemon-400"
                className="w-12 lg:mx-10 h-12 border-2 border-dashed bg-lemon-300/50 border-lemon-700 flex items-center justify-center"
              >
                {answers[rowIndex] && (
                  <Image
                    src={getVegetableImage(answers[rowIndex]!)}
                    alt={answers[rowIndex]}
                    className="w-10 h-10 object-contain"
                  />
                )}
              </Droppable>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end space-x-10">
          {draggableVegetables.map((vegetable) => (
            <Draggable
              key={vegetable}
              id={vegetable}
              className="w-16 h-16 flex items-center justify-center cursor-move"
            >
              <Image
                src={getVegetableImage(vegetable)}
                alt={vegetable}
                className="object-contain"
              />
            </Draggable>
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="w-16 h-16 flex items-center justify-center opacity-80">
              <Image
                src={getVegetableImage(activeId)}
                alt={activeId}
                className="object-contain"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {allAnswered && (
        <AlertDialog
          open={allAnswered}
          onOpenChange={() => {
            setAnswers(Array(6).fill(null));
            setScore(0);
            setAllAnswered(false);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Game Over</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              You scored {score} out of 6.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogAction>Play Again</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default VegetablePatternGame;
