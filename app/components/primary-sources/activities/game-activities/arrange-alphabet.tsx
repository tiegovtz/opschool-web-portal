import { CheckIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";

// Local imports
import { cn, getImageUrl } from "@/lib/utils";
import ActivityTitle from "../../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { ActivityResultsAlertDialog } from "../../../../../../tie_open_school_primary_frontend/components/templates/results";
import { useObjects } from "@/hooks/useObjects";
import { FeedbackType } from "@/lib/types/activity-types";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";
import { useWindowSize } from "@/shared/hooks/use-window-size";

interface ArrangeAlphabetProps {
  questions: {
    title: string;
    type?: string;
    fontSize?: number;
    isGameMode?: boolean;
    gameTimeLimit?: number;
  };
  feedback?: FeedbackType;
}

const ArrangeAlphabet = ({
  questions: {
    title,
    type,
    fontSize,
    isGameMode = false,
    gameTimeLimit = 300, // 5 minutes default
  },
  feedback,
}: ArrangeAlphabetProps) => {
  // Fetch objects for the activity
  const { objects, loading, error, refetch } = useObjects({
    type: type || null,
    limit: 10,
    autoFetch: true,
  });

  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isIncorrect, setIsIncorrect] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [totalWords, setTotalWords] = useState<number>(0);
  const [completedObjectIds, setCompletedObjectIds] = useState<number[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(
    new Set(),
  );

  const { playSound } = useSoundEffects();
  const { width } = useWindowSize();

  // Get current target word and image from objects
  const currentObject = objects[currentWordIndex];
  const currentWord = currentObject?.name.toLowerCase() || "";
  const currentImage = getImageUrl(currentObject?.imagePath || "", true);

  // Initialize game when objects are loaded
  useEffect(() => {
    if (
      !loading &&
      objects.length > 0 &&
      placedLetters.length === 0 &&
      currentWord
    ) {
      setPlacedLetters(Array(currentWord.length).fill(""));
      setTotalWords(objects.length);
    }
  }, [loading, objects, currentWord, placedLetters.length]);

  // Reset current word
  const resetCurrentWord = () => {
    setPlacedLetters(Array(currentWord.length).fill(""));
    setIsCorrect(false);
    setIsIncorrect(false);
    setWrongAttempts(0);
    setShowHint(false);
  };

  // Reset the entire activity
  const resetActivity = () => {
    setCurrentWordIndex(0);
    setIsTransitioning(false);
    setScore(0);
    setGameComplete(false);
    setCompletedObjectIds([]);
    setWrongAttempts(0);
    setShowHint(false);
    setCompletedQuestions(new Set());
    setIncorrectQuestions(new Set());
    if (objects.length > 0) {
      setPlacedLetters(Array(objects[0]?.name.length || 0).fill(""));
    }
    setIsCorrect(false);
    setIsIncorrect(false);
    // Refetch new objects
    refetch(completedObjectIds);
  };

  // Handle dialog close
  const handleDialogChange = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      resetActivity();
    }
  };

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (!gameComplete) {
      setGameComplete(true);
      setShowDialog(true);
    }
  }, [gameComplete]);

  // Handle game complete
  const handleGameComplete = useCallback((stats: GameStats) => {
    setGameComplete(true);
    setShowDialog(true);
  }, []);

  // Move to next word
  const moveToNextWord = useCallback(() => {
    setIsTransitioning(true);

    // Add current object to completed list
    if (currentObject) {
      setCompletedObjectIds((prev) => [...prev, currentObject.id]);
    }

    // Delay to allow exit animation to complete
    setTimeout(() => {
      if (currentWordIndex < objects.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
        setIsCorrect(false);
        setIsTransitioning(false);
        // Reset wrong attempts and hint for new word
        setWrongAttempts(0);
        setShowHint(false);
      } else {
        setGameComplete(true);
        setShowDialog(true);
      }
    }, 500);
  }, [currentWordIndex, objects.length, currentObject]);

  // Effect to initialize placedLetters when word changes
  useEffect(() => {
    if (currentWord) {
      setPlacedLetters(Array(currentWord.length).fill(""));
      setWrongAttempts(0);
      setShowHint(false);
    }
  }, [currentWord]);

  // Effect to clear incorrect state after animation
  useEffect(() => {
    if (isIncorrect) {
      const timer = setTimeout(() => {
        setIsIncorrect(false);
        resetCurrentWord();
        // Show hint after 2 wrong attempts
        if (wrongAttempts >= 2) {
          setShowHint(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isIncorrect, wrongAttempts]);

  // Effect to handle word completion and transition
  useEffect(() => {
    if (isCorrect && !isTransitioning) {
      const timer = setTimeout(() => {
        setScore((prev) => prev + 1);
        // Add to completed questions
        setCompletedQuestions((prev) => new Set([...prev, currentWordIndex]));
        moveToNextWord();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, isTransitioning, moveToNextWord, currentWordIndex]);

  // Alphabet array with colors
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const alphabetColors: Record<string, string> = {
    a: "text-purple-600",
    b: "text-pink-500",
    c: "text-amber-400",
    d: "text-amber-800",
    e: "text-gray-500",
    f: "text-blue-500",
    g: "text-red-600",
    h: "text-green-500",
    i: "text-yellow-400",
    j: "text-pink-500",
    k: "text-amber-400",
    l: "text-amber-800",
    m: "text-gray-500",
    n: "text-blue-500",
    o: "text-red-600",
    p: "text-green-500",
    q: "text-yellow-400",
    r: "text-purple-600",
    s: "text-pink-500",
    t: "text-amber-400",
    u: "text-amber-800",
    v: "text-gray-500",
    w: "text-blue-500",
    x: "text-red-600",
    y: "text-green-500",
    z: "text-yellow-400",
  };

  // Handle letter click
  const handleLetterClick = (letter: string) => {
    if (isTransitioning || !currentWord || isCorrect || isIncorrect) return;

    const emptyIndex = placedLetters.findIndex((l) => l === "");
    if (emptyIndex !== -1) {
      const newPlacedLetters = [...placedLetters];
      newPlacedLetters[emptyIndex] = letter;
      setPlacedLetters(newPlacedLetters);

      // Check if word is complete
      if (!newPlacedLetters.includes("")) {
        const wordIsCorrect =
          newPlacedLetters.join("").toLowerCase() === currentWord.toLowerCase();

        if (wordIsCorrect) {
          setIsCorrect(true);
          playSound("success");
        } else {
          setIsIncorrect(true);
          setWrongAttempts((prev) => prev + 1);
          // Add to incorrect questions
          setIncorrectQuestions((prev) => new Set([...prev, currentWordIndex]));
          playSound("failure");
        }
      } else {
        playSound("correct");
      }
    }
  };

  // Handle removing a letter
  const handleRemoveLetter = (index: number) => {
    if (isTransitioning || !currentWord || isCorrect) return;

    const newPlacedLetters = [...placedLetters];
    newPlacedLetters[index] = "";
    setPlacedLetters(newPlacedLetters);
    setIsCorrect(false);
    setIsIncorrect(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full flex-1 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-picton-blue-600 mb-4" />
        <p className="text-lg text-gray-600">Loading words...</p>
      </div>
    );
  }

  // Error state
  if (error || objects.length === 0) {
    return (
      <div className="flex flex-col h-full flex-1 items-center justify-center">
        <p className="text-lg text-red-600 mb-4">
          {error || "No words available for this activity"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-picton-blue-600 text-white rounded-lg hover:bg-picton-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <GameModeWrapper
      isGameMode={isGameMode}
      totalQuestions={totalWords}
      completedQuestions={completedQuestions}
      incorrectQuestions={incorrectQuestions}
      totalTimeLimit={gameTimeLimit}
      onTimeUp={handleTimeUp}
      onGameComplete={handleGameComplete}
      showTimer={isGameMode}
      showProgress={isGameMode}
      className="flex flex-col h-full flex-1"
    >
      <div className="flex flex-col h-full flex-1">
        <ActivityTitle title={title} />

        {/* Alphabet display */}
        <div className="flex flex-col items-center justify-between h-full flex-1 gap-10">
          <div
            className="grid grid-cols-12 md:gap-2 font-bold text-center"
            style={{
              gridTemplateColumns: `repeat(${width > 768 ? 13 : 7}, minmax(0, 1fr))`,
            }}
          >
            {alphabet.map((letter) => (
              <p
                key={letter}
                className={`cursor-pointer select-none text-4xl md:text-6xl ${alphabetColors[letter]} hover:scale-110 transition-transform`}
                onClick={() => handleLetterClick(letter)}
              >
                {letter}
              </p>
            ))}
          </div>

          {/* Image clue */}
          <div className="h-[300px] bg-white rounded-lg md:shadow-md p-2 relative">
            {showHint && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 rounded px-2 py-1 text-sm text-yellow-800">
                Hint: First letter is "{currentWord[0]?.toUpperCase()}"
              </div>
            )}
            {currentImage ? (
              <img
                src={currentImage}
                alt={`Clue for word: ${currentWord}`}
                className="w-full h-full object-contain rounded"
                onError={(e) => {
                  // Fallback if image fails to load
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML =
                      '<div class="w-full h-full flex items-center justify-center text-gray-500">Image failed to load</div>';
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No image available
              </div>
            )}
          </div>

          {/* Word challenge container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`word-container-${currentWordIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex justify-center items-center flex-wrap gap-2 md:gap-3 p-4 rounded-lg transition-colors duration-300",
                {
                  "bg-picton-blue-200": !isCorrect && !isIncorrect,
                  "bg-green-200": isCorrect,
                  "bg-red-200": isIncorrect,
                },
              )}
            >
              {/* Input boxes */}
              {currentWord.split("").map((letter, index) => (
                <div key={index} className="relative">
                  <motion.div
                    className={cn(
                      `w-10 md:w-16 h-10 md:h-16 rounded-md flex items-center justify-center text-xl md:text-3xl font-bold`,
                      {
                        "text-lemon-700": placedLetters[index] && !isIncorrect,
                        "text-red-600": placedLetters[index] && isIncorrect,
                        "border-2 border-picton-blue-300":
                          !placedLetters[index],
                        "bg-yellow-100 border-yellow-400":
                          showHint && index === 0 && !placedLetters[index],
                      },
                    )}
                    animate={{
                      backgroundColor: placedLetters[index]
                        ? isIncorrect
                          ? "#ffcccc"
                          : "#fcfec3"
                        : "transparent",
                      scale: placedLetters[index] ? [1, 1.07, 1] : 1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <AnimatePresence mode="wait">
                      {showHint && index === 0 && !placedLetters[index] && (
                        <motion.div
                          key="hint-letter"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 0.5, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="text-gray-400"
                        >
                          {currentWord[0]?.toUpperCase()}
                        </motion.div>
                      )}
                      {placedLetters[index] && (
                        <motion.div
                          key={`letter-${placedLetters[index]}-${index}`}
                          initial={{ y: -100, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 50, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          onClick={() => handleRemoveLetter(index)}
                          className="cursor-pointer w-full h-full flex items-center justify-center hover:bg-red-100 rounded"
                        >
                          {placedLetters[index]}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              ))}

              {/* Checkmark for correct answer */}
              {isCorrect && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="ml-2 text-green-600 text-3xl"
                >
                  <CheckIcon />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Results dialog */}
        <ActivityResultsAlertDialog
          score={score}
          total={totalWords}
          open={showDialog}
          onOpenChange={handleDialogChange}
          completionMessage={`Great job! You've completed ${score} out of ${totalWords} words correctly!`}
        />
      </div>
    </GameModeWrapper>
  );
};

export default ArrangeAlphabet;
