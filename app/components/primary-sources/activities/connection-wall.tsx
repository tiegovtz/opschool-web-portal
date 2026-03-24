"use client";

import { motion, LayoutGroup } from "motion/react";
import React, { Fragment, useEffect, useState } from "react";

// Local imports
import { cn, getImageUrl, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import { ActivityType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { ActivityResultsAlertDialog } from "@/components/templates/results";
import ActivityResults from "@/components/templates/results";
import { useObjects } from "@/hooks/useObjects";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";

type TItem = {
  id: number;
  name: string;
  category: string;
  imgSrc?: string;
};

type ConnectionWallActivityProps = {
  questions: {
    algorithm: ActivityType;
    title: string;
    questions: TItem[];
    isGameMode?: boolean;
    type?: string;
    gameTimeLimit?: number;
    useStrict?: boolean;
    showImages?: boolean;
  };
};

const ConnectionWallActivity = ({ questions }: ConnectionWallActivityProps) => {
  // State to track completed objects for replay functionality
  const [completedObjectIds, setCompletedObjectIds] = useState<number[]>([]);

  // Fetch objects for game mode
  const { objects, loading, error, refetch } = useObjects({
    type: questions.isGameMode ? questions.type || null : null,
    limit: 12, // 3 groups of 4 items each
    useStrict: questions.useStrict,
  });

  // console.log("objects", objects);

  // Convert objects to TItem format for game mode
  const gameItems = questions.isGameMode
    ? objects.map((obj) => ({
        id: obj.id,
        name: obj.name,
        category: obj.category || obj.name, // Use server-provided category or fallback
        imgSrc: questions?.showImages ? getImageUrl(obj.imagePath, true) : null,
      }))
    : questions.questions;

  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<TItem[]>([]);
  const [incorrectItems, setIncorrectItems] = useState<number[]>([]);
  const [matchedGroups, setMatchedGroups] = useState<TItem[][]>([]);
  const [remainingItems, setRemainingItems] = useState<TItem[]>([]);
  const [allAnswered, setAllAnswered] = useState<boolean>(false);
  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [timeUp, setTimeUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [completedGroups, setCompletedGroups] = useState<Set<number>>(
    new Set(),
  );
  const [incorrectAttempts, setIncorrectAttempts] = useState<Set<number>>(
    new Set(),
  );

  // Audio references
  const { playSound } = useSoundEffects();

  const numItemsPerGroup =
    questions.algorithm === ActivityType.ConnectionWallThreeRows ? 3 : 4;

  // Calculate score - the number of correctly matched groups
  const score = matchedGroups.length;
  const total = Math.ceil(gameItems.length / numItemsPerGroup);

  // Check if activity is disabled (completed or timed out)
  const isActivityDisabled = allAnswered || timeUp || gameComplete;

  // Initialize remaining items when game items are loaded
  useEffect(() => {
    if (questions.isGameMode && !loading && gameItems.length > 0) {
      // Reset game state when new objects are loaded
      setMatchedGroups([]);
      setSelectedItems([]);
      setIncorrectItems([]);
      setAllAnswered(false);
      setGameComplete(false);
      setTimeUp(false);
      setIsResetting(false);
      setCompletedGroups(new Set());
      setIncorrectAttempts(new Set());
      setShowCategories(false);
      setRemainingItems(shuffle(gameItems));
    } else if (!questions.isGameMode && gameItems.length > 0) {
      setRemainingItems(shuffle(gameItems));
    }
  }, [questions.isGameMode, loading, objects, gameItems.length]);

  // Check if all items have been matched
  useEffect(() => {
    if (
      remainingItems.length === numItemsPerGroup &&
      remainingItems.length > 0
    ) {
      const finalGroup = [...remainingItems];
      setMatchedGroups((prev) => [...prev, finalGroup]);
      setRemainingItems([]);
    } else if (remainingItems.length === 0 && matchedGroups.length > 0) {
      if (!allAnswered) {
        setAllAnswered(true);
        // Play success sound when all items are matched
        playSound("success");

        // Update completed groups for game mode
        if (questions.isGameMode) {
          const completedSet = new Set<number>();
          for (let i = 0; i < matchedGroups.length; i++) {
            completedSet.add(i);
          }
          setCompletedGroups(completedSet);
        }
      }
    }
  }, [remainingItems, questions.isGameMode]);

  // Handle item selection
  const handleItemClick = (item: TItem) => {
    if (isActivityDisabled) return;

    // If the item is already in incorrect state, ignore click
    if (incorrectItems.includes(item.id)) {
      return;
    }

    if (selectedItems.find((i) => i.id === item.id)) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
      return;
    }

    const newSelected = [...selectedItems, item];
    setSelectedItems(newSelected);

    // Check if we have a valid group
    if (newSelected.length >= numItemsPerGroup) {
      const categories: { [key: string]: number } = {};
      newSelected.forEach((item) => {
        categories[item.category] = (categories[item.category] || 0) + 1;
      });

      const matchingCategory = Object.entries(categories).find(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, count]) => count >= numItemsPerGroup,
      );

      if (matchingCategory) {
        const [category] = matchingCategory;
        const matchedItems = newSelected.filter(
          (item) => item.category === category,
        );

        playSound("correct");

        // Add to matched groups and remove from remaining items
        setMatchedGroups((prev) => [...prev, matchedItems]);
        setRemainingItems((prev) =>
          prev.filter(
            (item) => !matchedItems.find((matched) => matched.id === item.id),
          ),
        );
        setSelectedItems([]);
      } else {
        // This is an incorrect sequence
        const selectedIds = newSelected.map((item) => item.id);
        setIncorrectItems(selectedIds);

        // Track incorrect attempt for game mode
        if (questions.isGameMode) {
          setIncorrectAttempts((prev) => new Set([...prev, Date.now()]));
        }

        // Play fail sound
        playSound("failure");

        // Reset after animation time
        setTimeout(() => {
          setIncorrectItems([]);
          setSelectedItems([]);
        }, 800); // Animation duration
      }
    } else {
      playSound("click");
    }
  };

  // Handle game time up
  const handleGameTimeUp = () => {
    if (!allAnswered && !timeUp) {
      setTimeUp(true);
      setAllAnswered(true);
      playSound("failure");
    }
  };

  // Handle game completion from timer
  const handleGameComplete = (stats: GameStats) => {
    if (!allAnswered && !timeUp) {
      setAllAnswered(true);
    }
  };

  // Handle reset after completion dialog
  const handleReset = () => {
    // Prevent any race conditions by setting resetting state first
    setIsResetting(true);
    setAllAnswered(false);
    (!questions.isGameMode || !timeUp) && setShowCategories(true); // Show categories after user closes dialog
    setGameComplete(true); // Show results component

    // Clear resetting flag after a brief delay
    setTimeout(() => {
      setIsResetting(false);
    }, 50);
  };

  // Handle play again
  const handlePlayAgain = () => {
    // Set resetting flag first to prevent completion checks
    setIsResetting(true);

    // Reset game state immediately for both modes to prevent dialog re-triggering
    setMatchedGroups([]);
    setSelectedItems([]);
    setIncorrectItems([]);
    setShowCategories(false);
    setAllAnswered(false);
    setGameComplete(false);
    setTimeUp(false);
    setCompletedGroups(new Set());
    setIncorrectAttempts(new Set());

    if (questions.isGameMode) {
      // Track completed objects before fetching new ones
      const newCompletedIds = objects.map((obj) => obj.id);
      const updatedCompletedIds = [
        ...new Set([...completedObjectIds, ...newCompletedIds]),
      ];
      setCompletedObjectIds(updatedCompletedIds);

      // For game mode, fetch new objects excluding completed ones
      refetch(updatedCompletedIds);
    } else {
      // For regular mode, reinitialize with existing items
      setRemainingItems(shuffle(questions.questions));
    }

    // Clear resetting flag after a brief delay to ensure state has settled
    setTimeout(() => {
      setIsResetting(false);
    }, 100);
  };

  // Show loading state for game mode
  if (questions.isGameMode && loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">Loading objects...</h1>
      </div>
    );
  }

  // Show error state for game mode
  if (questions.isGameMode && error) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4 text-red-700">
          Error loading objects: {error}
        </h1>
      </div>
    );
  }

  // Show message if no objects found in game mode
  if (questions.isGameMode && !loading && gameItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">
          No objects found for the specified criteria
        </h1>
      </div>
    );
  }

  return (
    <GameModeWrapper
      isGameMode={questions.isGameMode || false}
      totalQuestions={total}
      completedQuestions={completedGroups}
      incorrectQuestions={incorrectAttempts}
      totalTimeLimit={questions.gameTimeLimit}
      onTimeUp={handleGameTimeUp}
      onGameComplete={handleGameComplete}
      showTimer={questions.isGameMode || false}
      showProgress={questions.isGameMode || false}
      className="h-full"
    >
      <div className="flex flex-col h-full">
        <ActivityTitle title={questions.title} />

        {/* Matched Groups Section */}
        <div className="bg-picton-blue-50 flex flex-col items-center justify-center p-1 md:p-4">
          <div className="overflow-x-auto md:overflow-x-visible w-full md:w-auto">
            <LayoutGroup>
              <div
                className={cn(
                  "grid gap-2 mx-auto h-full font-semibold text-sm md:text-lg",
                  {
                    "grid-cols-[repeat(3,minmax(150px,_1fr))] md:grid-cols-3":
                      questions.algorithm ===
                        ActivityType.ConnectionWallThreeRows && !showCategories,
                    "grid-cols-[repeat(4,minmax(150px,_1fr))] md:grid-cols-4":
                      (questions.algorithm !==
                        ActivityType.ConnectionWallThreeRows &&
                        !showCategories) ||
                      (questions.algorithm ===
                        ActivityType.ConnectionWallThreeRows &&
                        showCategories),
                    "grid-cols-[repeat(5,minmax(150px,_1fr))] md:grid-cols-5":
                      questions.algorithm !==
                        ActivityType.ConnectionWallThreeRows && showCategories,
                  },
                )}
              >
                {matchedGroups.length > 0 &&
                  matchedGroups.map((group, groupIndex) => (
                    <Fragment key={groupIndex}>
                      {group.map((item) => (
                        <motion.div
                          key={item.id}
                          layoutId={`item-${item.id}`}
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            backgroundColor: "#FCF9BE",
                          }}
                          transition={{
                            layout: {
                              duration: 1,
                              type: "spring",
                              damping: 30,
                              stiffness: 100,
                            },
                            opacity: { duration: 0.3 },
                          }}
                          className={cn(
                            "rounded p-1 md:p-2 h-full flex flex-col items-center text-center justify-center text-lemon-700 shadow-md",
                            {
                              "lg:w-[200px] min-h-[100px] lg:min-h-[120px]":
                                !item.imgSrc,
                            },
                          )}
                        >
                          {item.imgSrc && (
                            <img
                              src={item.imgSrc}
                              alt={item.name}
                              className={cn(
                                "w-[200px] h-[100px] object-contain",
                                {
                                  "h-[80px]": item.name,
                                },
                              )}
                            />
                          )}
                          <p>{item.name}</p>
                        </motion.div>
                      ))}

                      {/* Category Labels */}
                      {showCategories && group.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: -20, rotateX: -90 }}
                          animate={{ opacity: 1, x: 0, rotateX: 0 }}
                          transition={{
                            delay: 0.3 + groupIndex * 0.2,
                            duration: 0.5,
                            type: "spring",
                            stiffness: 200,
                          }}
                          className="bg-picton-blue-100 rounded-lg p-2 h-full flex flex-col items-center text-center justify-center font-bold shadow-lg border border-picton-blue-300"
                        >
                          {group[0].category}
                        </motion.div>
                      )}
                    </Fragment>
                  ))}

                {remainingItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={`item-${item.id}`}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      backgroundColor: incorrectItems.includes(item.id)
                        ? "#FF6B6B" // Red color for incorrect selection
                        : selectedItems.find((i) => i.id === item.id)
                          ? "#c1e3f6" // Selected blue color
                          : "#e3f0fb", // Default light blue
                    }}
                    transition={{
                      layout: {
                        duration: 1,
                        type: "spring",
                        damping: 30,
                        stiffness: 100,
                      },
                      opacity: { duration: 0.3 },
                      backgroundColor: { duration: 0.3 },
                    }}
                    whileHover={{
                      scale: isActivityDisabled ? 1 : 1.05,
                      transition: { duration: 0.2 },
                    }}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "cursor-pointer p-1 md:p-2 rounded-lg h-full flex flex-col items-center text-center justify-center shadow-md hover:shadow-lg",
                      {
                        "lg:w-[200px] min-h-[100px] lg:min-h-[120px]":
                          !item.imgSrc,
                        "animate-pulse": incorrectItems.includes(item.id),
                        "cursor-not-allowed": isActivityDisabled,
                      },
                    )}
                  >
                    {item.imgSrc && (
                      <img
                        src={item.imgSrc}
                        alt={item.name}
                        className={cn("w-[200px] h-[100px] object-contain", {
                          "h-[80px]": item.name,
                        })}
                      />
                    )}
                    <p>{item.name}</p>
                  </motion.div>
                ))}
              </div>
            </LayoutGroup>
          </div>

          {/* Results Component - shown after completion dialog is closed */}
          {gameComplete && (
            <div className="w-full mt-4">
              <ActivityResults
                score={timeUp ? 0 : score}
                total={total}
                onRestart={handlePlayAgain}
              />
            </div>
          )}
        </div>

        <ActivityResultsAlertDialog
          score={timeUp ? 0 : score}
          total={total}
          open={allAnswered && !isResetting}
          onOpenChange={(open) => {
            if (!open) {
              handleReset();
            }
          }}
          completionMessage={
            timeUp
              ? "⏰ Time's up! Don't worry, you can try again with new items. Keep practicing to improve your connection skills!"
              : `Excellent work! You successfully matched all ${total} groups! Your pattern recognition skills are impressive!`
          }
        />
      </div>
    </GameModeWrapper>
  );
};

export default ConnectionWallActivity;
