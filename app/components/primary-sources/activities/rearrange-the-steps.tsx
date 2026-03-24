import { Check, X } from "lucide-react";
import { DragEndEvent } from "@dnd-kit/core";
import React, { useState, useEffect } from "react";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import Droppable from "../../../../../tie_open_school_primary_frontend/components/ui/dnd/droppable";
import Draggable from "../../../../../tie_open_school_primary_frontend/components/ui/dnd/draggable";
import DNDContext from "../../../../../tie_open_school_primary_frontend/components/layout/dnd-context";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { FeedbackType } from "@/lib/types/activity-types";

/**
 * Props for the RearrangeTheStepsActivity component
 */
type TRearrangeTheStepsActivityProps = {
  questions: {
    title: string;
    type: string;
    hideWords: boolean;
    questions: {
      question: string;
      image: string;
    }[];
  };
  feedback: FeedbackType;
};

/**
 * Activity component that allows learners to rearrange steps in the correct order
 * using drag and drop interaction.
 */
const RearrangeTheStepsActivity = ({
  questions,
  feedback,
}: TRearrangeTheStepsActivityProps) => {
  // State management for the activity
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [placedItems, setPlacedItems] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [feedbacks, setFeedbacks] = useState<Record<number, boolean>>({});
  const [originalQuestions, setOriginalQuestions] = useState(
    questions.questions,
  );
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const { playSound } = useSoundEffects();

  /**
   * Initialize the activity with shuffled questions when component loads
   * or when questions change
   */
  useEffect(() => {
    initializeActivity();
  }, [questions]);

  /**
   * Prepares the activity by setting up the original questions and shuffling items
   */
  const initializeActivity = () => {
    if (questions.questions.length > 0) {
      // Store the original questions order for reference
      setOriginalQuestions(questions.questions);

      // Create items with their correct positions based on original order
      const items = questions.questions.map((q, index) => ({
        id: `item-${index}`,
        question: q.question,
        image: q.image,
        correctPosition: index,
      }));

      // Shuffle the items for display
      setAvailableItems(shuffle([...items]));
      setPlacedItems(Array(questions.questions.length).fill(undefined));
      setShowResults(false);
      setIsComplete(false);
      setFeedbacks({});
      setShowAlertDialog(false);
    }
  };

  /**
   * Handles moving a placed item to another position
   * @param activeId The ID of the item being moved
   * @param dropPosition The position where the item is being dropped
   * @param placedItemIndex The current index of the item in the placed items array
   * @returns Updated array of placed items
   */
  const handleMovePlacedItem = (
    activeId: string,
    dropPosition: number,
    placedItemIndex: number,
  ) => {
    // If the drop position already has an item or it's the same position, don't do anything
    if (placedItems[dropPosition] || placedItemIndex === dropPosition) {
      return null;
    }

    const item = placedItems[placedItemIndex];
    const newPlacedItems: ((typeof placedItems)[0] | undefined)[] = [];

    // Make sure the array has the correct length
    for (let i = 0; i < questions.questions.length; i++) {
      if (i === placedItemIndex) {
        // Skip the source position (will be undefined)
        newPlacedItems[i] = undefined;
      } else if (i === dropPosition) {
        // Place item at the target position
        newPlacedItems[i] = item;
      } else {
        // Copy existing items
        newPlacedItems[i] = placedItems[i];
      }
    }

    return newPlacedItems;
  };

  /**
   * Handles dragging an item from available items to a drop zone
   * @param activeId The ID of the item being dragged
   * @param dropPosition The position where the item is being dropped
   * @returns Object with updated placed and available items, and whether all items are placed
   */
  const handleDragFromAvailable = (activeId: string, dropPosition: number) => {
    const itemIndex = availableItems.findIndex((item) => item.id === activeId);

    if (itemIndex === -1) {
      return null;
    }

    const item = availableItems[itemIndex];

    // If the drop position already has an item, don't do anything
    if (placedItems[dropPosition]) {
      return null;
    }

    // Create a new array with the item at the drop position
    const newPlacedItems: ((typeof placedItems)[0] | undefined)[] = [];

    // Copy all existing items
    for (let i = 0; i < questions.questions.length; i++) {
      if (i === dropPosition) {
        // Add new item at drop position
        newPlacedItems[i] = item;
      } else {
        // Keep existing items
        newPlacedItems[i] = placedItems[i];
      }
    }

    // Calculate if this will be the last item to be placed
    const newAvailableItems = availableItems.filter((_, i) => i !== itemIndex);
    const willAllItemsBePlaced = newAvailableItems.length === 0;

    return {
      newPlacedItems,
      newAvailableItems,
      willAllItemsBePlaced,
    };
  };

  /**
   * Main handler for drag end events
   * Manages the logic for moving items between available and placed positions
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle drag from available items to drop zones
    if (activeId.includes("item-") && overId.includes("event-")) {
      const dropPosition = parseInt(overId.split("-")[1]) - 1;

      // Check if this is a placed item being moved
      const placedItemIndex = placedItems.findIndex(
        (item) => item && item.id === activeId,
      );

      if (placedItemIndex !== -1) {
        // Handle moving a placed item to another position
        const newPlacedItems = handleMovePlacedItem(
          activeId,
          dropPosition,
          placedItemIndex,
        );

        if (newPlacedItems) {
          // Update the state
          setPlacedItems(newPlacedItems);

          // Check if all items are placed after moving an item
          setTimeout(() => {
            const filledPositions = newPlacedItems.filter(Boolean).length;
            if (filledPositions === questions.questions.length) {
              calculateScore(newPlacedItems);
            }
          }, 0);
        }
      } else {
        // Handle dragging from available items
        const result = handleDragFromAvailable(activeId, dropPosition);

        if (result) {
          const { newPlacedItems, newAvailableItems, willAllItemsBePlaced } =
            result;

          // Update the state
          setPlacedItems(newPlacedItems);
          setAvailableItems(newAvailableItems);

          // If this was the last item, trigger score calculation with the new array
          if (willAllItemsBePlaced) {
            setTimeout(() => calculateScore(newPlacedItems), 100);
          }
        }
      }

      playSound("click");
    }
  };

  /**
   * Calculates the score based on the placement of items
   * @param itemsToScore The array of placed items to score (defaults to current placedItems state)
   */
  const calculateScore = (itemsToScore = placedItems) => {
    // Create a feedbacks object to track correctness of each position
    const newFeedbacks: Record<number, boolean> = {};
    let correct = 0;

    // Evaluate each position for correctness
    for (let index = 0; index < questions.questions.length; index++) {
      const item =
        index < itemsToScore.length ? itemsToScore[index] : undefined;

      // An item is correct if it exists and its correct position matches the current index
      if (item && item.correctPosition === index) {
        newFeedbacks[index] = true;
        correct++;
      } else {
        newFeedbacks[index] = false;
      }
    }

    // Update state with score results
    setScore(correct);
    setFeedbacks(newFeedbacks);
    setIsComplete(true);
    setShowAlertDialog(true);
    playSound("success");
  };

  /**
   * Resets the activity to its initial state with newly shuffled items
   */
  const resetActivity = () => {
    // Reset the state with shuffled items
    if (originalQuestions.length > 0) {
      const items = originalQuestions.map((q, index) => ({
        id: `item-${index}`,
        question: q.question,
        image: q.image,
        correctPosition: index,
      }));

      // Shuffle the items
      setAvailableItems(shuffle([...items]));
      setPlacedItems(Array(originalQuestions.length).fill(undefined));
      setShowResults(false);
      setIsComplete(false);
      setFeedbacks({});
      setShowAlertDialog(false);
    }
  };

  // Determine if we should show the detailed results or just color-coded feedback
  const shouldShowDetailedResults = feedback === "wrong-correct-answers";

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={questions.title} />

      {!showResults ? (
        <DNDContext onDragEnd={handleDragEnd}>
          {/* Available items */}
          <div
            className="grid mb-8 text-lg gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {Array.from({ length: questions.questions.length }).map(
              (_, index) => {
                const item = availableItems[index];
                return !item ? (
                  <div key={index} />
                ) : (
                  <Draggable
                    key={item.id}
                    id={item.id}
                    className="border border-picton-blue-200 bg-picton-blue-50 p-3 min-h-72 flex flex-col items-center justify-between rounded"
                  >
                    {!questions.hideWords && (
                      <p className="mb-2 text-center">{item.question}</p>
                    )}
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.question}
                        className="w-full h-32 object-contain grow"
                      />
                    )}
                  </Draggable>
                );
              },
            )}
          </div>

          {/* Drop zones */}
          <div
            className="grid mb-8 text-lg gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {Array.from({ length: questions.questions.length }).map(
              (_, index) => {
                const dropZoneId = `event-${index + 1}`;
                const item = placedItems[index];
                const isCorrect = feedbacks[index] === true;
                const isIncorrect = feedbacks[index] === false;

                return !item ? (
                  <Droppable
                    key={dropZoneId}
                    id={dropZoneId}
                    isOverClassName="bg-lemon-100 border-lemon-400"
                    className={`border border-picton-blue-300 rounded-md p-2 min-h-72 flex items-center justify-center ${
                      !item ? "bg-picton-blue-200" : "bg-white"
                    }`}
                  >
                    <span>
                      {questions.type} {index + 1}
                    </span>
                  </Droppable>
                ) : (
                  <Draggable
                    key={item.id}
                    id={item.id}
                    className={cn(
                      "border min-h-72 p-4 flex flex-col items-center justify-center rounded w-full",
                      // If activity is complete and feedback is "wrong-correct", show color-coded feedback
                      isComplete && feedback === "wrong-correct" && isCorrect
                        ? "border-green-500 bg-green-100 text-green-800"
                        : isComplete &&
                            feedback === "wrong-correct" &&
                            isIncorrect
                          ? "border-red-500 bg-red-100 text-red-800"
                          : "border-picton-blue-200 bg-lemon-100 text-lemon-700",
                    )}
                  >
                    {!questions.hideWords && (
                      <p className="mb-2 text-center">{item.question}</p>
                    )}
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.question}
                        className="w-full h-32 object-contain grow"
                      />
                    )}
                    {/* Show check/X icons for wrong-correct feedback */}
                    {isComplete && feedback === "wrong-correct" && (
                      <>
                        <p className="mb-2 text-center">step {index + 1}</p>
                        <div>
                          {isCorrect ? (
                            <Check className="h-6 w-6 text-green-600" />
                          ) : (
                            <X className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                      </>
                    )}
                  </Draggable>
                );
              },
            )}
          </div>

          {/* Show restart button for wrong-correct feedback */}
          {isComplete && feedback === "wrong-correct" && !showAlertDialog && (
            <ActivityResults
              score={score}
              total={questions.questions.length}
              onRestart={resetActivity}
            />
          )}
        </DNDContext>
      ) : (
        shouldShowDetailedResults && (
          <div className="flex flex-col h-full bg-picton-blue-100 text-lg p-6 overflow-y-auto">
            <div className="bg-picton-blue-50 rounded-lg p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {placedItems.map((item, idx) => {
                  const isCorrect = feedbacks[idx] === true;
                  const originalItem = questions.questions[idx];

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-lg flex flex-col",
                        isCorrect
                          ? "bg-green-50 border border-green-200"
                          : "bg-white border border-gray-200",
                      )}
                    >
                      <div className="flex justify-between items-center w-full mb-3">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-picton-blue-100 text-picton-blue-700 font-bold">
                            {idx + 1}
                          </span>
                          Step
                        </h3>
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full",
                            isCorrect
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600",
                          )}
                        >
                          {isCorrect ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <X className="h-5 w-5" />
                          )}
                        </div>
                      </div>

                      {isCorrect ? (
                        <div className="bg-green-50 rounded-md p-3 border border-green-100">
                          <div className="flex flex-col items-center text-center">
                            {!questions.hideWords && (
                              <p className="mb-2 font-medium text-green-700">
                                {item.question}
                              </p>
                            )}
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.question}
                                className="w-24 h-24 object-contain mt-1"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-red-50 rounded-md p-3 border border-red-100">
                            <p className="text-sm text-red-600 font-medium mb-1">
                              Your Answer:
                            </p>
                            <div className="flex flex-col items-center text-center">
                              {!questions.hideWords && (
                                <p className="text-gray-700">
                                  {item?.question || "No step placed"}
                                </p>
                              )}
                              {item?.image && (
                                <img
                                  src={item.image}
                                  alt={item.question}
                                  className="w-20 h-20 object-contain mt-1"
                                />
                              )}
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-md p-3 border border-green-100">
                            <p className="text-sm text-green-600 font-medium mb-1">
                              Correct Step:
                            </p>
                            <div className="flex flex-col items-center text-center">
                              {!questions.hideWords && (
                                <p className="text-gray-700">
                                  {originalItem.question}
                                </p>
                              )}
                              {originalItem.image && (
                                <img
                                  src={originalItem.image}
                                  alt={originalItem.question}
                                  className="w-20 h-20 object-contain mt-1"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <ActivityResults
                score={score}
                total={questions.questions.length}
                onRestart={resetActivity}
              />
            </div>
          </div>
        )
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={questions.questions.length}
        open={showAlertDialog}
        onOpenChange={(open) => {
          setShowAlertDialog(open);
          if (!open) {
            // Show results page for "wrong-correct-answers" feedback
            if (shouldShowDetailedResults) {
              setShowResults(true);
            }
          }
        }}
      />
    </div>
  );
};

export default RearrangeTheStepsActivity;
