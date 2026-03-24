import { useState, useEffect } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { CheckIcon, XIcon } from "lucide-react";

// Local imports
import { cn } from "@/lib/utils";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

interface MissingValuesJuniorActivityProps {
  feedback?: FeedbackType;
  questions: {
    title: string;
    numberRange: string;
    sequences: Array<{
      sequence: string[];
      answers: string[];
    }>;
  };
}

const MissingValuesJuniorActivity = ({
  feedback,
  questions: {
    title,
    numberRange = "0/10",
    sequences = [
      { sequence: ["0", "_", "10", "_", "20"], answers: ["5", "15"] },
    ],
  },
}: MissingValuesJuniorActivityProps) => {
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState<number>(0);
  const [placedNumbers, setPlacedNumbers] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isIncorrect, setIsIncorrect] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [targetPositions, setTargetPositions] = useState<number[]>([]);
  const [sequenceResults, setSequenceResults] = useState<boolean[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const { playSound } = useSoundEffects();

  // Get current sequence
  const currentSequenceData = sequences[currentSequenceIndex] || {
    sequence: [],
    answers: [],
  };
  const currentSequence = currentSequenceData.sequence;
  const correctAnswers = currentSequenceData.answers;

  // Find positions that need to be filled (positions with "_")
  useEffect(() => {
    const positions: number[] = [];
    currentSequence.forEach((item, index) => {
      if (item === "_") {
        positions.push(index);
      }
    });
    setTargetPositions(positions);
    setPlacedNumbers(Array(positions.length).fill(""));

    // Initialize results array if not already set
    if (sequenceResults.length === 0) {
      setSequenceResults(Array(sequences.length).fill(false));
    }
  }, [currentSequence, sequences.length, sequenceResults.length]);

  // Reset the entire activity
  const resetActivity = () => {
    setCurrentSequenceIndex(0);
    setIsTransitioning(false);
    setPlacedNumbers(Array(targetPositions.length).fill(""));
    setIsCorrect(false);
    setIsIncorrect(false);
    setSequenceResults(Array(sequences.length).fill(false));
    setScore(0);
    setShowResults(false);
  };

  // Handle dialog close
  const handleDialogChange = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      if (feedback === "none" || showResults) {
        resetActivity();
      } else {
        setShowResults(true);
      }
    }
  };

  // Move to next sequence or show results
  const moveToNextSequence = (isAnswerCorrect: boolean) => {
    setIsTransitioning(true);

    // Update sequence results
    const newResults = [...sequenceResults];
    newResults[currentSequenceIndex] = isAnswerCorrect;
    setSequenceResults(newResults);

    // Calculate score
    const newScore = newResults.filter(Boolean).length;
    setScore(newScore);

    // Delay to allow exit animation to complete
    setTimeout(() => {
      if (currentSequenceIndex < sequences.length - 1) {
        setCurrentSequenceIndex((prev) => prev + 1);
        setIsCorrect(false);
        setIsIncorrect(false);
        setIsTransitioning(false);
      } else {
        setShowDialog(true);
      }
    }, 500);
  };

  // Effect to clear incorrect state and move to next sequence after animation
  useEffect(() => {
    if (isIncorrect) {
      const timer = setTimeout(() => {
        moveToNextSequence(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isIncorrect]);

  // Effect to handle sequence completion and transition
  useEffect(() => {
    if (isCorrect && !isTransitioning) {
      const timer = setTimeout(() => {
        moveToNextSequence(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, isTransitioning]);

  // Generate number pad based on the number range
  const generateNumberPad = () => {
    const [min, max] = numberRange.split("/").map(Number);
    const numbers: number[] = [];

    for (let i = min; i <= max; i++) {
      numbers.push(i);
    }

    return numbers;
  };

  const numberPad = generateNumberPad();

  // Handle number click
  const handleNumberClick = (number: number) => {
    if (isTransitioning) return;

    const emptyIndex = placedNumbers.findIndex((n) => n === "");
    if (emptyIndex !== -1) {
      const newPlacedNumbers = [...placedNumbers];
      newPlacedNumbers[emptyIndex] = number.toString();
      setPlacedNumbers(newPlacedNumbers);

      // Check if sequence is complete
      if (!newPlacedNumbers.includes("")) {
        const isAllCorrect = newPlacedNumbers.every(
          (num, idx) => num === correctAnswers[idx]
        );

        if (isAllCorrect) {
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

  // Handle removing a number
  const handleRemoveNumber = (index: number) => {
    if (isTransitioning) return;

    const newPlacedNumbers = [...placedNumbers];
    newPlacedNumbers[index] = "";
    setPlacedNumbers(newPlacedNumbers);
    setIsCorrect(false);
  };

  // Render the current sequence with blanks for the user to fill
  const renderSequence = () => {
    const sequence = [...currentSequence];
    let blankCounter = 0;

    return sequence.map((item, index) => {
      if (item === "_") {
        const blankIndex = blankCounter;
        blankCounter++;

        return (
          <div key={`blank-${index}`} className="relative">
            <motion.div
              className={cn(
                `w-10 md:w-16 h-10 md:h-16 rounded-md flex items-center justify-center text-2xl md:text-3xl font-bold bg-picton-blue-200`,
                {
                  "text-lemon-700": placedNumbers[blankIndex] && !isIncorrect,
                  "text-red-600": placedNumbers[blankIndex] && isIncorrect,
                  "border-2 border-picton-blue-300": !placedNumbers[blankIndex],
                }
              )}
              animate={{
                backgroundColor: placedNumbers[blankIndex]
                  ? isIncorrect
                    ? "#ffcccc"
                    : "#fcfec3"
                  : "#c1e3f6",
                scale: placedNumbers[blankIndex] ? [1, 1.07, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {placedNumbers[blankIndex] && (
                  <motion.div
                    key={`number-${placedNumbers[blankIndex]}-${blankIndex}`}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    onClick={() => handleRemoveNumber(blankIndex)}
                    className="cursor-pointer w-full h-full flex items-center justify-center"
                  >
                    {placedNumbers[blankIndex]}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        );
      }

      return (
        <div
          key={`number-${index}`}
          className="w-10 md:w-16 h-10 md:h-16 rounded-md bg-picton-blue-50 flex items-center justify-center text-2xl md:text-3xl font-bold"
        >
          {item}
        </div>
      );
    });
  };

  // Render results view
  const renderResultsView = () => {
    return (
      <div className="space-y-6 w-full">
        <div className="space-y-4">
          {sequences.map((sequence, index) => {
            const isSequenceCorrect = sequenceResults[index];

            return (
              <div
                key={`result-${index}`}
                className={cn(
                  "flex items-center p-4 rounded-lg transition-colors duration-300",
                  isSequenceCorrect
                    ? "bg-green-100"
                    : feedback !== "none"
                    ? "bg-red-100"
                    : "bg-gray-100"
                )}
              >
                <div className="flex-shrink-0 mr-4">
                  {isSequenceCorrect ? (
                    <CheckIcon className="text-green-600 w-6 h-6" />
                  ) : feedback !== "none" ? (
                    <XIcon className="text-red-600 w-6 h-6" />
                  ) : (
                    <div className="w-6 h-6"></div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {sequence.sequence.map((item, seqIndex) => {
                    if (item === "_") {
                      const blankIndex = sequence.sequence
                        .slice(0, seqIndex)
                        .filter((i) => i === "_").length;
                      const answer = sequence.answers[blankIndex];

                      return (
                        <div
                          key={`result-seq-${index}-${seqIndex}`}
                          className={cn(
                            "w-12 h-12 rounded-md flex items-center justify-center text-xl font-bold",
                            feedback === "wrong-correct-answers" ||
                              feedback === "wrong-correct"
                              ? isSequenceCorrect
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                              : "bg-gray-200"
                          )}
                        >
                          {feedback === "wrong-correct-answers" &&
                          !isSequenceCorrect
                            ? answer
                            : "?"}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`result-seq-${index}-${seqIndex}`}
                        className="w-12 h-12 rounded-md bg-picton-blue-50 flex items-center justify-center text-xl font-bold"
                      >
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <ActivityResults
          score={score}
          total={sequences.length}
          onRestart={resetActivity}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={title} />

      {showResults && feedback !== "none" ? (
        renderResultsView()
      ) : (
        <div className="flex flex-col items-center justify-between w-4/5 mx-auto h-full">
          {/* Number Pad */}
          <div className="flex flex-wrap justify-center gap-2 font-bold text-center">
            {numberPad.map((number) => (
              <motion.div
                key={number}
                className="cursor-pointer select-none text-2xl md:text-3xl bg-picton-blue-200 rounded-md w-10 md:w-14 h-10 md:h-14 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNumberClick(number)}
              >
                {number}
              </motion.div>
            ))}
          </div>

          {/* Number sequence challenge container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`sequence-container-${currentSequenceIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex justify-center items-center gap-1 md:gap-3 p-2 md:p-4 rounded-lg transition-colors duration-300",
                {
                  "bg-picton-blue-200": !isCorrect && !isIncorrect,
                  "bg-green-200": isCorrect,
                  "bg-red-200": isIncorrect,
                }
              )}
            >
              {/* Render the sequence with input boxes */}
              {renderSequence()}

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

              {/* X mark for incorrect answer */}
              {isIncorrect && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="ml-2 text-red-600 text-3xl"
                >
                  <XIcon />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Results dialog */}
      <ActivityResultsAlertDialog
        open={showDialog}
        onOpenChange={handleDialogChange}
        isCompletionOnly={feedback === "none"}
        score={score}
        total={sequences.length}
        completionMessage={`You've completed all ${sequences.length} number sequences!`}
      />
    </div>
  );
};

export default MissingValuesJuniorActivity;
