"use client";

import { CSS } from "@dnd-kit/utilities";
import React, { useEffect, useRef, useState } from "react";
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";

// Local imports
import { cn, getImageUrl } from "@/lib/utils";
import ActivityResults from "@/components/templates/results";
import ActivityTitle from "@/components/templates/activity-title";
import DNDContext from "@/components/layout/dnd-context";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { DraggableProps } from "@/components/ui/dnd/draggable";
import { DroppableProps } from "@/components/ui/dnd/droppable";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { ActivityResultsAlertDialog } from "@/components/templates/results";
import { useObjects } from "@/hooks/useObjects";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";
import { useWindowSize } from "@/shared/hooks/use-window-size";

type RearrangeLettersInWordsProps = {
  questions: {
    title: string;
    isGameMode?: boolean;
    type?: string;
    words?: string;
    gameTimeLimit?: number; // Total time for all questions in seconds
    questions: {
      word: string;
      image?: string;
      id?: number;
    }[];
  };
};

const scrambleWord = (word: string) => {
  const answerChecker = new AnswerChecker();

  // Helper function to calculate similarity percentage using Levenshtein distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const distance = answerChecker.levenshteinDistance(
      str1.toLowerCase(),
      str2.toLowerCase()
    );
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  };

  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops
  let scrambled: string[];

  do {
    scrambled = word.split("");

    // Fisher-Yates shuffle algorithm
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
    }

    attempts++;

    // For short words (3 letters or less), just ensure it's not identical
    if (word.length <= 3) {
      if (scrambled.join("") !== word) break;
    } else {
      // For longer words, check similarity percentage
      const similarity = calculateSimilarity(word, scrambled.join(""));
      if (similarity < 0.8) break;
    }
  } while (attempts < maxAttempts);

  // If we couldn't find a good scramble after max attempts, return the last attempt
  return scrambled;
};

const DraggableLetter = ({
  id,
  children,
  data,
  onClick,
  disabled = false,
  ...props
}: DraggableProps & { onClick?: () => void; disabled?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data,
      disabled,
    });

  return (
    <div
      {...props}
      ref={setNodeRef}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      style={{
        touchAction: disabled ? "auto" : "none",
        transform: CSS.Transform.toString(transform),
      }}
      data-dragging={isDragging}
      onClick={disabled ? undefined : onClick}
      id={id}
    >
      {children}
    </div>
  );
};

const DraggableAnswerLetter = ({
  id,
  children,
  data,
  onClick,
  disabled = false,
  ...props
}: DraggableProps & { onClick?: () => void; disabled?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data,
      disabled,
    });

  return (
    <div
      {...props}
      ref={setNodeRef}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      style={{
        touchAction: disabled ? "auto" : "none",
        transform: CSS.Transform.toString(transform),
      }}
      data-dragging={isDragging}
      onClick={disabled ? undefined : onClick}
      id={id}
    >
      {children}
    </div>
  );
};

const DroppableArea = ({
  id,
  data,
  children,
  disabled = false,
  ...props
}: DroppableProps & { disabled?: boolean }) => {
  const { isOver, setNodeRef, over, active } = useDroppable({
    id,
    data,
    disabled,
  });

  const isCorrect =
    over?.data?.current?.accepts === active?.data?.current?.type;

  return (
    <div
      {...props}
      ref={setNodeRef}
      className={cn(props.className, {
        "bg-lemon-50": isOver && isCorrect && !disabled,
      })}
      id={id}
    >
      {children}
    </div>
  );
};

const RearrangeLettersInWords = ({
  questions: { title, isGameMode, type, words, gameTimeLimit, questions },
}: RearrangeLettersInWordsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [incorrectWords, setIncorrectWords] = useState<Set<number>>(new Set());
  const [animatingWords, setAnimatingWords] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // State to track completed objects for replay functionality
  const [completedObjectIds, setCompletedObjectIds] = useState<number[]>([]);

  // Fetch objects for game mode
  const { objects, loading, error, refetch } = useObjects({
    type: isGameMode ? type || null : null,
    words: isGameMode ? words || null : null,
  });

  // Use fetched objects if in game mode, otherwise use provided questions
  const gameQuestions = isGameMode
    ? objects.map((obj) => ({
        word: obj.name.toLowerCase(),
        image: obj.imagePath ? getImageUrl(obj.imagePath, true) : undefined,
        id: obj.id,
      }))
    : questions;
  const [scrambledWords, setScrambledWords] = useState(
    gameQuestions.map((word) => ({
      ...word,
      scrambled: scrambleWord(word.word),
    }))
  );
  const [currentAnswer, setCurrentAnswer] = useState<string[][]>(
    scrambledWords.map((word) => Array(word.word.length).fill(""))
  );
  const [allAnswered, setAllAnswered] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Check if activity is disabled (completed or timed out)
  const isActivityDisabled = allAnswered || timeUp || gameComplete;

  // Audio references
  const { playSound } = useSoundEffects();

  // Update scrambled words when objects are loaded in game mode
  useEffect(() => {
    if (isGameMode && !loading && gameQuestions.length > 0) {
      const newScrambledWords = gameQuestions.map((word) => ({
        ...word,
        scrambled: scrambleWord(word.word),
      }));
      setScrambledWords(newScrambledWords);
      setCurrentAnswer(
        newScrambledWords.map((word) => Array(word.word.length).fill(""))
      );

      // Reset game state when new objects are loaded
      setCompletedWords(new Set());
      setIncorrectWords(new Set());
      setAllAnswered(false);
      setGameComplete(false);
      setAnimatingWords(new Set());
      setIsDragging(false);
      setTimeUp(false);
      setIsResetting(false);
    }
  }, [isGameMode, loading, objects]);

  // Check if all words have been correctly arranged
  useEffect(() => {
    // Don't check completion if game is already complete, resetting, or if we're in a reset state
    if (gameComplete || allAnswered || isResetting) return;

    // Don't check if we don't have valid data
    if (currentAnswer.length === 0 || gameQuestions.length === 0) return;

    const allWordsComplete = currentAnswer.every(
      (word, index) =>
        word.join("").toLowerCase() ===
          gameQuestions[index]?.word?.toLowerCase() &&
        word.join("").length === gameQuestions[index]?.word?.length
    );

    if (allWordsComplete && currentAnswer.length > 0) {
      setAllAnswered(true);
      // Play success sound when all words are completed
      playSound("success");
    }
  }, [currentAnswer]);

  // Show loading state for game mode
  if (isGameMode && loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">Loading objects...</h1>
      </div>
    );
  }

  // Show error state for game mode
  if (isGameMode && error) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4 text-red-700">
          Error loading objects: {error}
        </h1>
      </div>
    );
  }

  // Show message if no objects found in game mode
  if (isGameMode && !loading && gameQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">
          No objects found for the specified criteria
        </h1>
      </div>
    );
  }

  // Helper function to check if a word is complete and correct
  const checkWordCompletion = (wordIndex: number, answer: string[][]) => {
    const wordAnswer = answer[wordIndex].join("").toLowerCase();
    const correctWord = gameQuestions[wordIndex]?.word?.toLowerCase();
    const isComplete = wordAnswer.length === correctWord.length;
    const isCorrect = wordAnswer === correctWord;

    return { isComplete, isCorrect };
  };

  // Helper function to find the next available slot for a word
  const findNextAvailableSlot = (wordIndex: number): number | null => {
    const wordAnswer = currentAnswer[wordIndex];
    for (let i = 0; i < wordAnswer.length; i++) {
      if (wordAnswer[i] === "") {
        return i;
      }
    }
    return null; // No available slot
  };

  // Helper function to handle letter placement (for both drag and click)
  const placeLetter = (
    wordIndex: number,
    slotIndex: number,
    letter: string,
    letterIndex?: number
  ) => {
    const updatedAnswer = [...currentAnswer];
    updatedAnswer[wordIndex][slotIndex] = letter;
    setCurrentAnswer(updatedAnswer);

    // Play click sound for successful placement
    playSound("click");

    // Remove the letter from the scrambled word if it's from there
    if (letterIndex !== undefined) {
      const updatedScrambledWords = [...scrambledWords];
      updatedScrambledWords[wordIndex].scrambled = updatedScrambledWords[
        wordIndex
      ].scrambled.map((letter, index) => (index === letterIndex ? "" : letter));
      setScrambledWords(updatedScrambledWords);
    }

    // Check word completion after updating
    const { isComplete, isCorrect } = checkWordCompletion(
      wordIndex,
      updatedAnswer
    );

    if (isComplete) {
      if (isCorrect && !completedWords.has(wordIndex)) {
        // Correct word completion
        setCompletedWords((prev) => new Set([...prev, wordIndex]));
        playSound("correct");
        animateCorrectWord(wordIndex);
      } else if (!isCorrect && !completedWords.has(wordIndex)) {
        // Incorrect word completion
        handleIncorrectWord(wordIndex);
      }
    }
  };

  // Handle click-to-place functionality
  const handleLetterClick = (
    wordIndex: number,
    letterIndex: number,
    letter: string
  ) => {
    if (isDragging || isActivityDisabled) return; // Don't handle clicks during drag or when activity is disabled

    const nextSlot = findNextAvailableSlot(wordIndex);
    if (nextSlot !== null) {
      placeLetter(wordIndex, nextSlot, letter, letterIndex);
    }
  };

  // Handle letter swapping in answer zone
  const handleLetterSwap = (
    fromWordIndex: number,
    fromSlotIndex: number,
    toWordIndex: number,
    toSlotIndex: number
  ) => {
    if (fromWordIndex !== toWordIndex) return; // Only allow swapping within the same word

    const updatedAnswer = [...currentAnswer];
    const fromLetter = updatedAnswer[fromWordIndex][fromSlotIndex];
    const toLetter = updatedAnswer[toWordIndex][toSlotIndex];

    // Swap the letters
    updatedAnswer[fromWordIndex][fromSlotIndex] = toLetter;
    updatedAnswer[toWordIndex][toSlotIndex] = fromLetter;

    setCurrentAnswer(updatedAnswer);
    playSound("click");

    // Check word completion after swapping
    const { isComplete, isCorrect } = checkWordCompletion(
      fromWordIndex,
      updatedAnswer
    );

    if (isComplete) {
      if (isCorrect && !completedWords.has(fromWordIndex)) {
        setCompletedWords((prev) => new Set([...prev, fromWordIndex]));
        playSound("correct");
        animateCorrectWord(fromWordIndex);
      } else if (!isCorrect && !completedWords.has(fromWordIndex)) {
        handleIncorrectWord(fromWordIndex);
      }
    }
  };

  // Animation for correct word feedback
  const animateCorrectWord = (wordIndex: number) => {
    setAnimatingWords((prev) => new Set([...prev, wordIndex]));

    // Remove animation state after animation completes
    setTimeout(() => {
      setAnimatingWords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(wordIndex);
        return newSet;
      });
    }, 1000); // Animation duration
  };

  // Handle incorrect word feedback
  const handleIncorrectWord = (wordIndex: number) => {
    // Play buzz sound for incorrect word
    playSound("failure");

    // Mark word as incorrect temporarily
    setIncorrectWords((prev) => new Set([...prev, wordIndex]));

    // Return letters to scrambled section with new shuffle
    setTimeout(() => {
      const updatedScrambledWords = [...scrambledWords];
      const currentWordAnswer = currentAnswer[wordIndex];

      // Get all placed letters for this word
      const placedLetters = currentWordAnswer.filter((letter) => letter !== "");

      // Reshufffle the letters before returning them
      const reshuffledLetters = [...placedLetters];
      for (let i = reshuffledLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reshuffledLetters[i], reshuffledLetters[j]] = [
          reshuffledLetters[j],
          reshuffledLetters[i],
        ];
      }

      // Add reshuffled letters back to scrambled section
      updatedScrambledWords[wordIndex].scrambled = [
        ...updatedScrambledWords[wordIndex].scrambled.filter(
          (letter) => letter !== ""
        ),
        ...reshuffledLetters,
      ];

      setScrambledWords(updatedScrambledWords);

      // Clear the answer slots for this word
      const updatedAnswer = [...currentAnswer];
      updatedAnswer[wordIndex] = Array(
        gameQuestions[wordIndex].word.length
      ).fill("");
      setCurrentAnswer(updatedAnswer);

      // Remove incorrect state
      setIncorrectWords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(wordIndex);
        return newSet;
      });
    }, 800); // Delay before returning letters
  };

  const handleDragStart = () => {
    if (isActivityDisabled) return; // Don't allow drag start when activity is disabled
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);

    if (isActivityDisabled) return; // Don't process drag end when activity is disabled

    const { active, over } = event;

    if (over && over?.data?.current?.accepts === active?.data?.current?.type) {
      const activeIdParts = String(active.id).split("-");
      const [overWordIndex, overSlotIndex] = String(over.id)
        .split("-")
        .map(Number);

      const wordIndex = Number(activeIdParts[0]);

      // Check if we're dragging from answer zone (will have 'slot' as second part)
      const isFromAnswerZone = activeIdParts[1] === "slot";

      if (isFromAnswerZone) {
        // Handle dragging from answer zone to answer zone (swapping or moving)
        const fromSlotIndex = Number(activeIdParts[2]);
        const actualLetter = currentAnswer[wordIndex][fromSlotIndex];

        if (currentAnswer[overWordIndex][overSlotIndex] !== "") {
          // Target slot is occupied - swap letters
          handleLetterSwap(
            wordIndex,
            fromSlotIndex,
            overWordIndex,
            overSlotIndex
          );
        } else {
          // Target slot is empty - move letter
          const updatedAnswer = [...currentAnswer];
          updatedAnswer[wordIndex][fromSlotIndex] = ""; // Clear source
          updatedAnswer[overWordIndex][overSlotIndex] = actualLetter; // Place in target
          setCurrentAnswer(updatedAnswer);
          playSound("click");

          // Check word completion
          const { isComplete, isCorrect } = checkWordCompletion(
            overWordIndex,
            updatedAnswer
          );
          if (isComplete) {
            if (isCorrect && !completedWords.has(overWordIndex)) {
              setCompletedWords((prev) => new Set([...prev, overWordIndex]));
              playSound("correct");
              animateCorrectWord(overWordIndex);
            } else if (!isCorrect && !completedWords.has(overWordIndex)) {
              handleIncorrectWord(overWordIndex);
            }
          }
        }
      } else {
        // Handle dragging from scrambled section to answer zone
        const letterIndex = Number(activeIdParts[1]);
        const letter = activeIdParts[2];

        if (currentAnswer[overWordIndex][overSlotIndex] !== "") {
          // Target slot is occupied - place letter and move occupied letter to next available slot
          const occupiedLetter = currentAnswer[overWordIndex][overSlotIndex];
          const nextSlot = findNextAvailableSlot(overWordIndex);

          if (nextSlot !== null) {
            const updatedAnswer = [...currentAnswer];
            updatedAnswer[overWordIndex][overSlotIndex] = letter;
            updatedAnswer[overWordIndex][nextSlot] = occupiedLetter;
            setCurrentAnswer(updatedAnswer);

            // Remove letter from scrambled section
            const updatedScrambledWords = [...scrambledWords];
            updatedScrambledWords[wordIndex].scrambled = updatedScrambledWords[
              wordIndex
            ].scrambled.map((scrambledLetter, index) =>
              index === letterIndex ? "" : scrambledLetter
            );
            setScrambledWords(updatedScrambledWords);

            playSound("click");

            // Check word completion
            const { isComplete, isCorrect } = checkWordCompletion(
              overWordIndex,
              updatedAnswer
            );
            if (isComplete) {
              if (isCorrect && !completedWords.has(overWordIndex)) {
                setCompletedWords((prev) => new Set([...prev, overWordIndex]));
                playSound("correct");
                animateCorrectWord(overWordIndex);
              } else if (!isCorrect && !completedWords.has(overWordIndex)) {
                handleIncorrectWord(overWordIndex);
              }
            }
          } else {
            // No available slot - just place the letter (this will trigger word completion check)
            placeLetter(wordIndex, overSlotIndex, letter, letterIndex);
          }
        } else {
          // Target slot is empty - normal placement
          placeLetter(wordIndex, overSlotIndex, letter, letterIndex);
        }
      }
    }
  };

  // Handle reset after completion dialog
  const handleReset = () => {
    // Prevent any race conditions by setting resetting state first
    setIsResetting(true);
    setAllAnswered(false);
    setGameComplete(true); // Show results component

    // Clear resetting flag after a brief delay
    setTimeout(() => {
      setIsResetting(false);
    }, 50);
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

  // Handle play again
  const handlePlayAgain = () => {
    // Set resetting flag first to prevent completion checks
    setIsResetting(true);

    // Reset game state immediately for both modes to prevent dialog re-triggering
    setAllAnswered(false);
    setGameComplete(false);
    setTimeUp(false);
    setCompletedWords(new Set());
    setIncorrectWords(new Set());
    setAnimatingWords(new Set());
    setIsDragging(false);

    if (isGameMode) {
      // Track completed objects before fetching new ones
      // This only happens when user explicitly clicks "Play Again" after closing the completion dialog
      const newCompletedIds = objects.map((obj) => obj.id);
      const updatedCompletedIds = [
        ...new Set([...completedObjectIds, ...newCompletedIds]),
      ];
      setCompletedObjectIds(updatedCompletedIds);

      // For game mode, fetch new objects excluding completed ones
      // API will return new objects first, then fill with previously completed ones if needed
      refetch(updatedCompletedIds);
    } else {
      // For regular mode, use existing questions
      const newScrambledWords = questions.map((word) => ({
        ...word,
        scrambled: scrambleWord(word.word),
      }));

      setScrambledWords(newScrambledWords);
      setCurrentAnswer(
        newScrambledWords.map((word) => Array(word.word.length).fill(""))
      );
    }

    // Clear resetting flag after a brief delay to ensure state has settled
    setTimeout(() => {
      setIsResetting(false);
    }, 100);
  };

  return (
    <GameModeWrapper
      isGameMode={isGameMode || false}
      totalQuestions={scrambledWords.length}
      completedQuestions={completedWords}
      incorrectQuestions={incorrectWords}
      totalTimeLimit={gameTimeLimit}
      onTimeUp={handleGameTimeUp}
      onGameComplete={handleGameComplete}
      showTimer={isGameMode || false}
      showProgress={isGameMode || false}
      className="h-full"
    >
      <DNDContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={width > 768 ? [restrictToHorizontalAxis] : []}
      >
        <div
          className={cn("h-full flex flex-col", {
            dragging: isDragging,
          })}
        >
          <ActivityTitle title={title} />

          <div
            className={cn(
              "flex flex-col justify-between h-full gap-4 relative"
            )}
          >
            {scrambledWords.map((word, wordIndex) => (
              <div
                ref={containerRef}
                key={wordIndex}
                className="flex items-center justify-between bg-picton-blue-50 gap-5 p-2 h-full"
              >
                <div className="w-full flex flex-col md:flex-row gap-2 items-center justify-between">
                  {/* Draggable letters */}
                  <div className="flex items-center gap-1 text-xl md:text-[30px]">
                    {/*<p className="mr-4">{wordIndex + 1}.</p>*/}
                    {word.scrambled.map(
                      (letter, letterIndex) =>
                        letter !== "" && (
                          <DraggableLetter
                            key={letterIndex}
                            id={`${wordIndex}-${letterIndex}-${letter}`}
                            data={{
                              type: wordIndex,
                            }}
                            disabled={isActivityDisabled}
                            className={cn(
                              "w-8 md:w-11 h-9 md:h-12 flex items-center bg-picton-blue-200 justify-center rounded draggable-letter",
                              {
                                "cursor-grab active:cursor-grabbing hover:bg-picton-blue-300":
                                  !isActivityDisabled,
                                "cursor-not-allowed": isActivityDisabled,
                              }
                            )}
                            onClick={() =>
                              handleLetterClick(wordIndex, letterIndex, letter)
                            }
                          >
                            {letter}
                          </DraggableLetter>
                        )
                    )}
                  </div>

                  {/* Droppable slots */}
                  <div className="flex gap-1">
                    {Array.from({ length: word.word.length }).map(
                      (_, slotIndex) => {
                        const isWordComplete = completedWords.has(wordIndex);
                        const isWordIncorrect = incorrectWords.has(wordIndex);
                        const isWordAnimating = animatingWords.has(wordIndex);
                        const slotFilled =
                          currentAnswer[wordIndex][slotIndex] !== "";

                        return slotFilled ? (
                          // Show the letter if the slot is filled - make it draggable
                          <DraggableAnswerLetter
                            key={slotIndex}
                            id={`${wordIndex}-slot-${slotIndex}`}
                            data={{
                              type: wordIndex,
                            }}
                            disabled={isActivityDisabled}
                            className={cn(
                              "w-8 md:w-11 h-9 md:h-12 text-xl md:text-[30px] flex items-center justify-center rounded font-semibold letter-slot",
                              {
                                "bg-green-100 text-green-700 border border-green-400":
                                  isWordComplete,
                                "bg-red-100 text-red-700 border border-red-400":
                                  isWordIncorrect,
                                animating: isWordAnimating,
                                "bg-picton-blue-200":
                                  !isWordComplete && !isWordIncorrect,
                                "cursor-grab active:cursor-grabbing":
                                  !isActivityDisabled,
                                "cursor-not-allowed": isActivityDisabled,
                              }
                            )}
                          >
                            {currentAnswer[wordIndex][slotIndex]}
                          </DraggableAnswerLetter>
                        ) : (
                          // Droppable area if the slot is empty
                          <DroppableArea
                            key={slotIndex}
                            id={`${wordIndex}-${slotIndex}`}
                            data={{
                              accepts: wordIndex,
                            }}
                            disabled={isActivityDisabled}
                            className={cn(
                              "w-8 md:w-11 h-9 md:h-12 flex items-center bg-picton-blue-200 justify-center rounded border-2 border-dashed border-picton-blue-400 transition-colors",
                              {
                                "hover:border-picton-blue-600":
                                  !isActivityDisabled,
                              }
                            )}
                          >
                            {currentAnswer[wordIndex][slotIndex]}
                          </DroppableArea>
                        );
                      }
                    )}
                  </div>
                </div>

                {word.image && (
                  <div className="w-[20%] relative h-full">
                    <img
                      src={word.image}
                      alt="Word image"
                      className="object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Results Component - shown after completion dialog is closed */}
          {gameComplete && (
            <div className="bg-picton-blue-50 p-4">
              <ActivityResults
                score={completedWords.size}
                total={scrambledWords.length}
                onRestart={handlePlayAgain}
              />
            </div>
          )}
        </div>

        {/* Results Alert Dialog */}
        <ActivityResultsAlertDialog
          score={timeUp ? 0 : scrambledWords.length}
          total={scrambledWords.length}
          open={allAnswered && !isResetting}
          onOpenChange={(open) => {
            if (!open) {
              handleReset();
            }
          }}
          completionMessage={
            timeUp
              ? "⏰ Time's up! Don't worry, you can try again with new words. Keep practicing to improve your speed!"
              : "Fantastic! You've successfully rearranged all the letters to form the correct words!"
          }
        />
      </DNDContext>
    </GameModeWrapper>
  );
};

export default RearrangeLettersInWords;
