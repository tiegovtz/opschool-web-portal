import { CheckIcon } from "lucide-react";
import { useState, useEffect } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";

// Local imports
import { cn } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { ActivityResultsAlertDialog } from "@/components/templates/results";

interface AlphabetActivityProps {
  questions: {
    title: string;
    targetWords: string[];
  };
}

const AlphabetActivity = ({
  questions: { title, targetWords = ["heel"] },
}: AlphabetActivityProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [placedLetters, setPlacedLetters] = useState<string[]>(
    Array(targetWords[0]?.length || 0).fill("")
  );
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isIncorrect, setIsIncorrect] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const { playSound } = useSoundEffects();

  // Get current target word
  const currentWord = targetWords[currentWordIndex] || "";

  // Reset current word
  const resetCurrentWord = () => {
    setPlacedLetters(Array(currentWord.length).fill(""));
    setIsCorrect(false);
    setIsIncorrect(false);
  };

  // Reset the entire activity
  const resetActivity = () => {
    setCurrentWordIndex(0);
    setIsTransitioning(false);
    setPlacedLetters(Array(targetWords[0]?.length || 0).fill(""));
    setIsCorrect(false);
    setIsIncorrect(false);
  };

  // Handle dialog close
  const handleDialogChange = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      resetActivity();
    }
  };

  // Move to next word
  const moveToNextWord = () => {
    setIsTransitioning(true);

    // Delay to allow exit animation to complete
    setTimeout(() => {
      if (currentWordIndex < targetWords.length - 1) {
        setCurrentWordIndex((prev) => prev + 1);
        setIsCorrect(false);
        setIsTransitioning(false);
      } else {
        setShowDialog(true);
      }
    }, 500);
  };

  // Effect to initialize placedLetters when word changes
  useEffect(() => {
    setPlacedLetters(Array(currentWord.length).fill(""));
  }, [currentWord]);

  // Effect to clear incorrect state after animation
  useEffect(() => {
    if (isIncorrect) {
      const timer = setTimeout(() => {
        setIsIncorrect(false);
        resetCurrentWord();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isIncorrect]);

  // Effect to handle word completion and transition
  useEffect(() => {
    if (isCorrect && !isTransitioning) {
      const timer = setTimeout(() => {
        moveToNextWord();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, isTransitioning]);

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
    if (isTransitioning) return;

    const emptyIndex = placedLetters.findIndex((l) => l === "");
    if (emptyIndex !== -1) {
      const newPlacedLetters = [...placedLetters];
      newPlacedLetters[emptyIndex] = letter;
      setPlacedLetters(newPlacedLetters);

      // Check if word is complete
      if (!newPlacedLetters.includes("")) {
        const wordIsCorrect = newPlacedLetters.join("") === currentWord;

        if (wordIsCorrect) {
          setIsCorrect(true);
          playSound("success");
        } else {
          setIsIncorrect(true);
          playSound("failure");
        }
      } else {
        playSound("correct");
      }
    }
  };

  // Handle removing a letter
  const handleRemoveLetter = (index: number) => {
    if (isTransitioning) return;

    const newPlacedLetters = [...placedLetters];
    newPlacedLetters[index] = "";
    setPlacedLetters(newPlacedLetters);
    setIsCorrect(false);
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={title} />

      {/* Alphabet display */}
      <div className="flex flex-col items-center justify-between h-full">
        <div
          className="grid grid-cols-12 gap-2 font-bold text-center"
          style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
        >
          {alphabet.map((letter) => (
            <p
              key={letter}
              className={`cursor-pointer select-none text-6xl ${alphabetColors[letter]}`}
              onClick={() => handleLetterClick(letter)}
            >
              {letter}
            </p>
          ))}
        </div>

        {/* Image clue - This could be updated to change with each word */}
        <div className="max-w-44 max-h-44">
          <img
            src="https://softteacher.com/smartbook/Pre-Unit/1682270887570tongue%20tranparent.png"
            alt="Clue"
            className="w-full h-full object-cover"
          />
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
              "flex justify-center items-center gap-3 p-4 rounded-lg transition-colors duration-300",
              {
                "bg-picton-blue-200": !isCorrect && !isIncorrect,
                "bg-green-200": isCorrect,
                "bg-red-200": isIncorrect,
              }
            )}
          >
            {/* Input boxes */}
            {currentWord.split("").map((letter, index) => (
              <div key={index} className="relative">
                <motion.div
                  className={cn(
                    `w-16 h-16 rounded-md flex items-center justify-center text-3xl font-bold`,
                    {
                      "text-lemon-700": placedLetters[index] && !isIncorrect,
                      "text-red-600": placedLetters[index] && isIncorrect,
                      "border-2 border-picton-blue-300": !placedLetters[index],
                    }
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
                    {placedLetters[index] && (
                      <motion.div
                        key={`letter-${placedLetters[index]}-${index}`}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        onClick={() => handleRemoveLetter(index)}
                        className="cursor-pointer w-full h-full flex items-center justify-center"
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
        open={showDialog}
        onOpenChange={handleDialogChange}
        isCompletionOnly={true}
        completionMessage={`Great job! You've successfully completed all ${targetWords.length} words!`}
      />
    </div>
  );
};

export default AlphabetActivity;
