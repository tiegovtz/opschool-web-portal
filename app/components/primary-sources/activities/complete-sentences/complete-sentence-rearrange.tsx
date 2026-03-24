import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";

// local imports
import { cn, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TCompleteSentenceByRearrangingActivityProps = {
  questions: {
    title: string;
    questions: {
      id: string;
      question: string;
      answer: string;
      options: string[];
    }[];
  };
};

const CompleteSentenceByRearrangingActivity = ({
  questions,
}: TCompleteSentenceByRearrangingActivityProps) => {
  // Add state for shuffled questions
  const [shuffledQuestions, setShuffledQuestions] = useState(
    questions.questions.map((q) => ({
      ...q,
      options: shuffle([...q.options]),
    }))
  );

  // State for selected word indices per question (instead of word values)
  const [selectedWordIndices, setSelectedWordIndices] = useState<{
    [key: number]: number[];
  }>({});

  const [score, setScore] = useState(0);
  const [checkedQuestions, setCheckedQuestions] = useState<number[]>([]);
  const [feedbacks, setFeedbacks] = useState<{ [key: number]: boolean }>({});
  const [showResults, setShowResults] = useState(false);

  const { playSound } = useSoundEffects();

  // Shuffle questions function
  const shuffleQuestions = () => {
    setShuffledQuestions(
      questions.questions.map((q) => ({
        ...q,
        options: shuffle([...q.options]),
      }))
    );
  };

  useEffect(() => {
    // Initialize with shuffled questions on first load
    shuffleQuestions();
  }, [questions.questions]);

  // Handle adding a word to the answer by its index
  const handleWordClick = (questionIndex: number, wordIndex: number) => {
    // Skip if question has been checked already
    if (checkedQuestions.includes(questionIndex)) {
      return;
    }

    // Create or update the selected word indices array for this question
    const currentSelectedIndices = selectedWordIndices[questionIndex] || [];
    const newSelectedIndices = [...currentSelectedIndices, wordIndex];
    setSelectedWordIndices({
      ...selectedWordIndices,
      [questionIndex]: newSelectedIndices,
    });

    // Check if this completes the sentence
    const expectedWordCount =
      shuffledQuestions[questionIndex].answer.split(" ").length;
    if (newSelectedIndices.length === expectedWordCount) {
      // Auto-check when sentence is complete
      setTimeout(() => {
        const selectedWords = newSelectedIndices.map(
          (index) => shuffledQuestions[questionIndex].options[index]
        );
        const userAnswer = selectedWords.join(" ").trim().toLowerCase();
        const correctAnswer =
          shuffledQuestions[questionIndex].answer.toLowerCase();
        const isCorrect = userAnswer === correctAnswer;

        setFeedbacks((prev) => ({ ...prev, [questionIndex]: isCorrect }));
        setCheckedQuestions((prev) => [...prev, questionIndex]);

        if (isCorrect) {
          setScore((prev) => prev + 1);
          playSound("correct");
        } else {
          playSound("failure");
        }

        // Check if all questions are now complete
        if (checkedQuestions.length + 1 === shuffledQuestions.length) {
          playSound("success");
        }
      }, 100);
    }
  };

  // Handle removing a word from the answer by its position in selected array
  const handleRemoveWord = (questionIndex: number, selectedIndex: number) => {
    // Skip if question has been checked already
    if (checkedQuestions.includes(questionIndex)) {
      return;
    }

    const currentSelectedIndices = selectedWordIndices[questionIndex] || [];
    const newSelectedIndices = currentSelectedIndices.filter(
      (_, idx) => idx !== selectedIndex
    );
    setSelectedWordIndices({
      ...selectedWordIndices,
      [questionIndex]: newSelectedIndices,
    });
  };

  // Helper function to get selected words for display
  const getSelectedWords = (questionIndex: number) => {
    const selectedIndices = selectedWordIndices[questionIndex] || [];
    return selectedIndices.map(
      (index) => shuffledQuestions[questionIndex].options[index]
    );
  };

  // Reset game function
  const resetGame = () => {
    shuffleQuestions();
    setSelectedWordIndices({});
    setScore(0);
    setCheckedQuestions([]);
    setFeedbacks({});
    setShowResults(false);
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      {!showResults ? (
        <div className="flex flex-col h-full bg-picton-blue-100">
          <div className="grid grid-cols-3 gap-4 py-4 flex-1 overflow-y-auto">
            {shuffledQuestions.map((question, index) => {
              const selectedIndices = selectedWordIndices[index] || [];
              const selectedWords = getSelectedWords(index);

              return (
                <div
                  key={index}
                  className={cn("h-full rounded-lg", {
                    "bg-picton-blue-50": !checkedQuestions.includes(index),
                    "bg-green-100 text-green-700":
                      checkedQuestions.includes(index) && feedbacks[index],
                    "bg-red-100 text-red-700":
                      checkedQuestions.includes(index) &&
                      feedbacks[index] === false,
                  })}
                >
                  <div className="p-4 flex flex-col justify-between h-full">
                    <div className="flex flex-col flex-1 justify-between gap-4">
                      {/* Available words */}
                      <div className="flex flex-wrap gap-2">
                        {question.options.map((word, optionIndex) => (
                          <motion.button
                            key={optionIndex}
                            className={cn(
                              "bg-picton-blue-100 px-3 py-1 text-xl rounded border border-picton-blue-300 cursor-pointer hover:bg-picton-blue-200",
                              {
                                "opacity-50 pointer-events-none":
                                  selectedIndices.includes(optionIndex) ||
                                  checkedQuestions.includes(index),
                                "bg-green-100 border-green-300":
                                  checkedQuestions.includes(index) &&
                                  feedbacks[index],
                                "bg-red-100 border-red-300":
                                  checkedQuestions.includes(index) &&
                                  feedbacks[index] === false,
                              }
                            )}
                            onClick={() => handleWordClick(index, optionIndex)}
                            whileHover={{
                              scale: checkedQuestions.includes(index)
                                ? 1
                                : 1.05,
                            }}
                            whileTap={{
                              scale: checkedQuestions.includes(index)
                                ? 1
                                : 0.95,
                            }}
                            title={
                              checkedQuestions.includes(index)
                                ? ""
                                : "Click to add to sentence"
                            }
                          >
                            {word}
                          </motion.button>
                        ))}
                      </div>

                      {/* Answer area with selected words */}
                      <div className="min-h-[3rem] border-b-2 border-dashed border-picton-blue-500 flex flex-wrap gap-2 items-center p-2">
                        {selectedWords.map((word, wordIndex) => (
                          <motion.span
                            key={wordIndex}
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={cn(
                              "bg-picton-blue-200 px-3 py-1 text-xl rounded cursor-pointer",
                              {
                                "bg-green-200":
                                  checkedQuestions.includes(index) &&
                                  feedbacks[index],
                                "bg-red-200":
                                  checkedQuestions.includes(index) &&
                                  feedbacks[index] === false,
                                "pointer-events-none":
                                  checkedQuestions.includes(index),
                              }
                            )}
                            onClick={() => handleRemoveWord(index, wordIndex)}
                            title={
                              checkedQuestions.includes(index)
                                ? ""
                                : "Click to remove"
                            }
                          >
                            {word}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 ml-auto">
                      {checkedQuestions.includes(index) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            "flex items-center justify-center rounded-full p-1",
                            feedbacks[index]
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          )}
                        >
                          {feedbacks[index] ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <X className="h-5 w-5" />
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View Results Button */}
          {checkedQuestions.length === shuffledQuestions.length && (
            <div className="p-4 bg-picton-blue-100 border-t">
              <Button
                onClick={() => setShowResults(true)}
                variant="brand-lemon"
                className="w-full text-lg py-3"
              >
                View Results
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full bg-picton-blue-100 text-lg p-6 overflow-y-auto">
          <div className="bg-picton-blue-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {shuffledQuestions.map((question, idx) => {
                const selectedWords = getSelectedWords(idx);
                const userAnswer = selectedWords.join(" ").trim().toLowerCase();
                const isCorrect = userAnswer === question.answer.toLowerCase();

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-lg border",
                      isCorrect
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-full p-1 w-fit ml-auto",
                        isCorrect
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      )}
                    >
                      {isCorrect ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Your answer:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedWords.length > 0 ? (
                            selectedWords.map((word, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "px-3 py-1 rounded-md",
                                  isCorrect
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                )}
                              >
                                {word}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">(no answer)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Correct answer:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {question.answer.split(" ").map((word, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-md bg-green-100 text-green-700"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <ActivityResults
              score={score}
              total={shuffledQuestions.length}
              onRestart={resetGame}
            />
          </div>
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={shuffledQuestions.length}
        open={
          checkedQuestions.length === shuffledQuestions.length && !showResults
        }
        onOpenChange={(open) => {
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </div>
  );
};

export default CompleteSentenceByRearrangingActivity;
