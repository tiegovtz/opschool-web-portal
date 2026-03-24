"use client";

import { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { useState, Fragment, useCallback, memo, useEffect } from "react";

// Local imports
import { cn, getImageUrl, shuffle } from "@/lib/utils";
import DNDContext from "@/components/layout/dnd-context";
import Droppable from "@/components/ui/dnd/droppable";
import Draggable from "@/components/ui/dnd/draggable";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { useObjects } from "@/hooks/useObjects";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";
import { useWindowSize } from "@/shared/hooks/use-window-size";

type TMatchingItemsPictureTextActivityProps = {
  questions: {
    title: string;
    fontSize?: string;
    category: "text-to-text" | "image-to-text" | "image-to-image";
    leftItems: MatchingItem[];
    rightItems: MatchingItem[];
    isGameMode?: boolean;
    type?: string;
    gameTimeLimit?: number;
    useStrict?: boolean;
  };
};

interface MatchingItem {
  id: string;
  content: string | { color: string } | { imageSrc: string };
}

const MatchingItemsPictureTextActivity = ({
  questions: currentQuestion,
}: TMatchingItemsPictureTextActivityProps) => {
  // State to track completed objects for replay functionality
  const [completedObjectIds, setCompletedObjectIds] = useState<number[]>([]);

  // Fetch objects for game mode
  const { objects, loading, error, refetch } = useObjects({
    type: currentQuestion.isGameMode ? currentQuestion.type || null : null,
    limit: 6, // 6 pairs of items
    // useStrict: currentQuestion.useStrict,
  });

  // Convert objects to MatchingItem format for game mode
  const getGameItems = () => {
    if (!currentQuestion.isGameMode) {
      return {
        leftItems: currentQuestion.leftItems,
        rightItems: currentQuestion.rightItems,
      };
    }

    if (currentQuestion.category === "image-to-text") {
      // Matching items pictures game - image to syllables
      const leftItems = objects.map((obj) => ({
        id: String(obj.id),
        content: { imageSrc: getImageUrl(obj.imagePath, true) },
      }));
      const rightItems = objects.map((obj) => ({
        id: String(obj.id),
        content: obj.syllables || obj.name, // Use syllables or fallback to name
      }));
      return { leftItems, rightItems };
    } else {
      // Matching items game - object name to syllables
      const leftItems = objects.map((obj) => ({
        id: String(obj.id),
        content: obj.name,
      }));
      const rightItems = objects.map((obj) => ({
        id: String(obj.id),
        content: obj.syllables || obj.name, // Use syllables or fallback to name
      }));
      return { leftItems, rightItems };
    }
  };

  const { leftItems: gameLeftItems, rightItems: gameRightItems } =
    getGameItems();
  const [connections, setConnections] = useState<
    {
      "start-key": string;
      "start-position": { x: number; y: number };
      "end-key": string;
      "end-position": { x: number; y: number };
      isCorrect?: boolean;
    }[]
  >([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [shuffledRightItems, setShuffledRightItems] = useState<MatchingItem[]>(
    [],
  );
  const [timeUp, setTimeUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [completedPairs, setCompletedPairs] = useState<Set<number>>(new Set());
  const [incorrectAttempts, setIncorrectAttempts] = useState<Set<number>>(
    new Set(),
  );

  const { width } = useWindowSize();
  const { playSound } = useSoundEffects();

  // Initial shuffling of right items
  useEffect(() => {
    if (currentQuestion.isGameMode && !loading && gameRightItems.length > 0) {
      // Reset game state when new objects are loaded
      setConnections([]);
      setScore(0);
      setAllAnswered(false);
      setShowResults(false);
      setTimeUp(false);
      setIsResetting(false);
      setCompletedPairs(new Set());
      setIncorrectAttempts(new Set());
      setShuffledRightItems(shuffle([...gameRightItems]));
    } else if (!currentQuestion.isGameMode) {
      setShuffledRightItems(shuffle([...currentQuestion.rightItems]));
    }
  }, [currentQuestion.isGameMode, loading, objects, gameRightItems.length]);

  useEffect(() => {
    // If all the connections are made, show the score
    const totalItems = currentQuestion.isGameMode
      ? gameLeftItems.length
      : currentQuestion.leftItems.length;
    if (connections.length === totalItems) {
      // Calculate the score
      const correctConnections = connections.filter(
        (connection) => connection.isCorrect,
      );

      setScore(correctConnections.length);

      setAllAnswered(true);

      // Update completed pairs for game mode
      if (currentQuestion.isGameMode) {
        const completedSet = new Set<number>();
        connections.forEach((_, index) => completedSet.add(index));
        setCompletedPairs(completedSet);
      }
    }
  }, [
    connections,
    currentQuestion.isGameMode,
    gameLeftItems.length,
    currentQuestion.leftItems.length,
  ]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;

    // Get the id of the active draggable, get the element and get the position
    const el = document.getElementById(String(active.id));
    if (!el) return;

    const { x, y } = {
      x: el.offsetLeft + el.offsetWidth,
      y: el.offsetTop + el.offsetHeight / 2,
    };

    setDragStart({ x, y });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { over, active } = event;

      if (over && String(over.id).startsWith("right-")) {
        const fromItem = String(active.id).split("-")[1];
        const toItem = String(over.id).split("-")[1];

        // Get the id of the active draggable, get the element and get the position
        const activeEl = document.getElementById(String(active.id));
        const overEl = document.getElementById(String(over.id));

        setDragStart(null);
        setDragEnd(null);

        playSound("click");

        if (activeEl && overEl) {
          setConnections((prevConnections) => {
            // Remove any existing connection to the same end-key or start-key
            const filteredConnections = prevConnections.filter(
              (connection) =>
                connection["start-key"] !== String(active.id) &&
                connection["end-key"] !== String(over.id),
            );

            // Check if the match is correct
            const leftItems = currentQuestion.isGameMode
              ? gameLeftItems
              : currentQuestion.leftItems;
            const rightItems = currentQuestion.isGameMode
              ? gameRightItems
              : currentQuestion.rightItems;

            const leftItem = leftItems.find(
              (item) => String(item.id) === fromItem,
            );
            const rightItem = rightItems.find(
              (item) => String(item.id) === toItem,
            );
            const isCorrect = leftItem?.id === rightItem?.id;

            // Track incorrect attempt for game mode
            if (!isCorrect && currentQuestion.isGameMode) {
              setIncorrectAttempts((prev) => new Set([...prev, Date.now()]));
            }

            return [
              ...filteredConnections,
              {
                "start-key": String(active.id),
                "start-position": {
                  x: activeEl.offsetLeft + activeEl.offsetWidth,
                  y: activeEl.offsetTop + activeEl.offsetHeight / 2,
                },
                "end-key": String(over.id),
                "end-position": {
                  x: overEl.offsetLeft,
                  y: overEl.offsetTop + overEl.offsetHeight / 2,
                },
                isCorrect,
              },
            ];
          });
        }
      } else {
        setDragStart(null);
        setDragEnd(null);
      }
    },
    [
      currentQuestion.leftItems,
      currentQuestion.rightItems,
      currentQuestion.isGameMode,
      gameLeftItems,
      gameRightItems,
    ],
  );

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active } = event;

    const el = document.getElementById(String(active.id));
    if (!el) return;

    const { x, y } = {
      x: event.delta.x + el.offsetWidth + el.offsetLeft,
      y: event.delta.y + el.offsetTop + el.offsetHeight / 2,
    };

    setDragEnd({ x, y });
  }, []);

  const endKeyHasConnection = (id: string) => {
    return connections.some((connection) => connection["end-key"] === id);
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
    setIsResetting(true);
    setAllAnswered(false);
    setShowResults(true);

    setTimeout(() => {
      setIsResetting(false);
    }, 50);
  };

  // Handle play again
  const resetActivity = () => {
    setIsResetting(true);
    setConnections([]);
    setScore(0);
    setAllAnswered(false);
    setShowResults(false);
    setTimeUp(false);
    setCompletedPairs(new Set());
    setIncorrectAttempts(new Set());

    if (currentQuestion.isGameMode) {
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
      setShuffledRightItems(shuffle([...currentQuestion.rightItems]));
    }

    setTimeout(() => {
      setIsResetting(false);
    }, 100);
  };

  const renderItemContent = (item: MatchingItem) => {
    let content;
    if (typeof item.content === "string") {
      content = item.content;
    } else if ("imageSrc" in item.content) {
      content = (
        <div className="w-20 md:w-36 max-h-[400px]">
          <img
            src={item.content.imageSrc}
            alt={item.id}
            className="object-contain w-full h-full"
          />
        </div>
      );
    }

    return content;
  };

  // Show loading state for game mode
  if (currentQuestion.isGameMode && loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">Loading objects...</h1>
      </div>
    );
  }

  // Show error state for game mode
  if (currentQuestion.isGameMode && error) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4 text-red-700">
          Error loading objects: {error}
        </h1>
      </div>
    );
  }

  // Show message if no objects found in game mode
  if (currentQuestion.isGameMode && !loading && gameLeftItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">
          No objects found for the specified criteria
        </h1>
      </div>
    );
  }

  const leftItemsToRender = currentQuestion.isGameMode
    ? gameLeftItems
    : currentQuestion.leftItems;
  const totalPairs = leftItemsToRender.length;

  return (
    <GameModeWrapper
      isGameMode={currentQuestion.isGameMode || false}
      totalQuestions={totalPairs}
      completedQuestions={completedPairs}
      incorrectQuestions={incorrectAttempts}
      totalTimeLimit={currentQuestion.gameTimeLimit}
      onTimeUp={handleGameTimeUp}
      onGameComplete={handleGameComplete}
      showTimer={currentQuestion.isGameMode || false}
      showProgress={currentQuestion.isGameMode || false}
      className="h-full"
    >
      <div className="flex flex-col h-full text-lg">
        <ActivityTitle title={currentQuestion.title} />

        <DNDContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
        >
          <div
            className="flex justify-between h-full md:p-4 relative overflow-hidden"
            style={{
              fontSize:
                width <= 640
                  ? "14px"
                  : `${currentQuestion.fontSize}px` || "20px",
            }}
          >
            <div
              className={cn("space-y-4 flex flex-col justify-evenly", {
                "md:w-[15%]":
                  currentQuestion.category === "image-to-image" ||
                  currentQuestion.category === "image-to-text",
                "w-[30%]": currentQuestion.category === "text-to-text",
              })}
            >
              {leftItemsToRender.map((item, i) => {
                // Optimize className logic to avoid complex conditions during drag
                let itemClassName =
                  "w-full bg-picton-blue-200 rounded-lg flex items-center justify-center p-1 md:p-4 relative";

                if (currentQuestion.category === "text-to-text") {
                  itemClassName += " min-h-20";
                }

                if (showResults) {
                  itemClassName += " cursor-default";
                  const connection = connections.find(
                    (conn) => conn["start-key"] === `left-${item.id}`,
                  );
                  if (connection?.isCorrect) {
                    itemClassName = itemClassName.replace(
                      "bg-picton-blue-200",
                      "bg-green-100 border-2 border-green-300",
                    );
                  } else if (connection && !connection.isCorrect) {
                    itemClassName = itemClassName.replace(
                      "bg-picton-blue-200",
                      "bg-red-100 border-2 border-red-300",
                    );
                  }
                }

                return (
                  <Draggable
                    key={i}
                    id={`left-${item.id}`}
                    resize={false}
                    disabled={showResults}
                    className={itemClassName}
                  >
                    <span className="pointer-events-none">
                      {renderItemContent(item)}
                    </span>
                  </Draggable>
                );
              })}
            </div>
            <div
              className={cn("space-y-4 flex flex-col justify-evenly", {
                "md:w-[15%]": currentQuestion.category === "image-to-image",
                "w-[30%] md:w-auto md:max-w-xl":
                  currentQuestion.category === "text-to-text" ||
                  currentQuestion.category === "image-to-text",
              })}
            >
              {shuffledRightItems.map((item, i) => {
                // Optimize className logic to avoid complex conditions during drag
                let itemClassName =
                  "w-full rounded-lg flex items-center justify-start relative p-1 md:p-4";

                if (
                  currentQuestion.category === "text-to-text" ||
                  currentQuestion.category === "image-to-text"
                ) {
                  itemClassName += " p-2 md:p-4 leading-5";
                }

                if (currentQuestion.category === "image-to-image") {
                  itemClassName += " !justify-center";
                }

                if (
                  currentQuestion.category === "text-to-text" ||
                  currentQuestion.category === "image-to-text"
                ) {
                  itemClassName += " min-h-20";
                }

                if (showResults) {
                  itemClassName += " cursor-default";
                  const connection = connections.find(
                    (conn) => conn["end-key"] === `right-${item.id}`,
                  );
                  if (connection?.isCorrect) {
                    itemClassName += " bg-green-100 border-2 border-green-300";
                  } else if (connection && !connection.isCorrect) {
                    itemClassName += " bg-red-100 border-2 border-red-300";
                  } else {
                    itemClassName += " bg-picton-blue-50";
                  }
                } else {
                  const hasConnection = endKeyHasConnection(`right-${item.id}`);
                  if (hasConnection) {
                    itemClassName += " bg-lemon-100 text-lemon-700";
                  } else {
                    itemClassName += " bg-picton-blue-50";
                  }
                }

                return (
                  <Droppable
                    key={i}
                    id={`right-${item.id}`}
                    disabled={showResults}
                    isOverClassName="bg-lemon-50"
                    className={itemClassName}
                  >
                    {renderItemContent(item)}
                  </Droppable>
                );
              })}
            </div>

            {/* Connection lines */}
            <DrawLines
              connections={connections}
              dragStart={showResults ? null : dragStart}
              dragEnd={showResults ? null : dragEnd}
              showCorrectness={showResults}
            />

            {/* Results overlay with animated feedback */}
            {showResults && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Correctness indicators for left items */}
                <div
                  className={cn(
                    "absolute space-y-4 flex flex-col justify-evenly",
                    {
                      "w-[15%]":
                        currentQuestion.category === "image-to-image" ||
                        currentQuestion.category === "image-to-text",
                      "w-[30%]": currentQuestion.category === "text-to-text",
                    },
                  )}
                  style={{
                    top: "1rem",
                    left: "1rem",
                    height: "calc(100% - 2rem)",
                  }}
                >
                  {leftItemsToRender.map((item, i) => {
                    const connection = connections.find(
                      (conn) => conn["start-key"] === `left-${item.id}`,
                    );
                    return (
                      <div
                        key={i}
                        className="relative w-full h-full flex items-center justify-center"
                      >
                        {connection && (
                          <div
                            className={cn(
                              "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold z-10 shadow-lg",
                              {
                                "bg-green-500": connection.isCorrect,
                                "bg-red-500": !connection.isCorrect,
                              },
                            )}
                          >
                            {connection.isCorrect ? "✓" : "✗"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Correctness indicators for right items */}
                <div
                  className={cn(
                    "absolute space-y-4 flex flex-col justify-evenly",
                    {
                      "w-[15%]": currentQuestion.category === "image-to-image",
                      "w-[30%]": currentQuestion.category === "text-to-text",
                      "max-w-xl": currentQuestion.category === "image-to-text",
                    },
                  )}
                  style={{
                    top: "1rem",
                    right: "1rem",
                    height: "calc(100% - 2rem)",
                    left: "auto",
                    // currentQuestion.category === "image-to-text"
                    //   ? "auto"
                    //   : currentQuestion.category === "image-to-image"
                    //     ? "70%"
                    //     : "70%",
                  }}
                >
                  {shuffledRightItems.map((item, i) => {
                    const connection = connections.find(
                      (conn) => conn["end-key"] === `right-${item.id}`,
                    );
                    return (
                      <div
                        key={i}
                        className="relative w-full h-full flex items-center justify-start"
                      >
                        {connection && (
                          <div
                            className={cn(
                              "absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold z-10 shadow-lg",
                              {
                                "bg-green-500": connection.isCorrect,
                                "bg-red-500": !connection.isCorrect,
                              },
                            )}
                          >
                            {connection.isCorrect ? "✓" : "✗"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DNDContext>
        {showResults && (
          <ActivityResults
            score={timeUp ? 0 : score}
            total={totalPairs}
            onRestart={resetActivity}
          />
        )}

        <ActivityResultsAlertDialog
          score={timeUp ? 0 : score}
          total={totalPairs}
          open={allAnswered && !isResetting && !showResults}
          onOpenChange={(open) => {
            if (!open) {
              handleReset();
            }
          }}
          completionMessage={
            timeUp
              ? "⏰ Time's up! Don't worry, you can try again with new items. Keep practicing to improve your syllable matching skills!"
              : `Fantastic work! You successfully matched all ${totalPairs} pairs! Your syllable recognition skills are excellent!`
          }
        />
      </div>
    </GameModeWrapper>
  );
};

// Updated line drawing component with correctness indicators
const DrawLines = memo(
  ({
    connections,
    dragStart,
    dragEnd,
    showCorrectness = false,
  }: {
    connections: {
      "start-key": string;
      "start-position": { x: number; y: number };
      "end-key": string;
      "end-position": { x: number; y: number };
      isCorrect?: boolean;
    }[];
    dragStart: { x: number; y: number } | null;
    dragEnd: { x: number; y: number } | null;
    showCorrectness?: boolean;
  }) => {
    // Only recalculate positions once when showing results, not during drag
    const [recalculatedConnections, setRecalculatedConnections] = useState<
      typeof connections
    >([]);

    useEffect(() => {
      if (showCorrectness && connections.length > 0) {
        // Only recalculate once when results are first shown
        const updated = connections.map((connection) => {
          const startEl = document.getElementById(connection["start-key"]);
          const endEl = document.getElementById(connection["end-key"]);

          if (startEl && endEl) {
            return {
              ...connection,
              "start-position": {
                x: startEl.offsetLeft + startEl.offsetWidth,
                y: startEl.offsetTop + startEl.offsetHeight / 2,
              },
              "end-position": {
                x: endEl.offsetLeft,
                y: endEl.offsetTop + endEl.offsetHeight / 2,
              },
            };
          }

          return connection;
        });
        setRecalculatedConnections(updated);
      }
    }, [showCorrectness]);
    // Draw a line between two points using a div
    const renderLine = (
      start: { x: number; y: number },
      end: { x: number; y: number },
      key: string,
      isCorrect?: boolean,
    ) => {
      // Calculate distance between points
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate angle
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      const lineBackground = showCorrectness
        ? isCorrect
          ? "linear-gradient(to right, #22c55e 8px, transparent 8px)"
          : "linear-gradient(to right, #ef4444 8px, transparent 8px)"
        : "linear-gradient(to right, #a17507 5px, transparent 5px)";

      const lineWidth = showCorrectness ? (isCorrect ? "4px" : "3px") : "2px";

      return (
        <Fragment key={key}>
          {/* Start circle */}
          <div
            className={
              showCorrectness
                ? isCorrect
                  ? "bg-green-500"
                  : "bg-red-500"
                : "bg-lemon-700"
            }
            style={{
              position: "absolute",
              left: start.x - (showCorrectness ? 6 : 5),
              top: start.y - (showCorrectness ? 6 : 5),
              width: showCorrectness ? "12px" : "10px",
              height: showCorrectness ? "12px" : "10px",
              borderRadius: "50%",
              zIndex: 1,
              boxShadow: showCorrectness ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
            }}
          />

          {/* Line */}
          <div
            style={{
              position: "absolute",
              left: start.x,
              top: start.y,
              width: `${distance}px`,
              height: lineWidth,
              backgroundImage: lineBackground,
              backgroundSize: showCorrectness
                ? "16px " + lineWidth
                : "10px " + lineWidth,
              backgroundRepeat: "repeat-x",
              transformOrigin: "0 0",
              transform: `rotate(${angle}deg)`,
              zIndex: 0,
              boxShadow: showCorrectness ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
            }}
          />

          {/* End Circle */}
          <div
            className={
              showCorrectness
                ? isCorrect
                  ? "bg-green-500"
                  : "bg-red-500"
                : "bg-lemon-700"
            }
            style={{
              position: "absolute",
              left: end.x - (showCorrectness ? 6 : 5),
              top: end.y - (showCorrectness ? 6 : 5),
              width: showCorrectness ? "12px" : "10px",
              height: showCorrectness ? "12px" : "10px",
              borderRadius: "50%",
              zIndex: 1,
              boxShadow: showCorrectness ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
            }}
          />
        </Fragment>
      );
    };

    const connectionsToRender =
      showCorrectness && recalculatedConnections.length > 0
        ? recalculatedConnections
        : connections;

    return (
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
        {connectionsToRender.map((connection) =>
          renderLine(
            connection["start-position"],
            connection["end-position"],
            `${connection["start-key"]}-${connection["end-key"]}`,
            connection.isCorrect,
          ),
        )}

        {dragStart && dragEnd && renderLine(dragStart, dragEnd, "drag-line")}
      </div>
    );
  },
);

DrawLines.displayName = "DrawLines";

export default MatchingItemsPictureTextActivity;
