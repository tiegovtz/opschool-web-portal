"use client";

import { motion } from "motion/react";
import debounce from "lodash.debounce";
import { Check, X } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

// local imports
import { cn, getImageUrl, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import { useObjects } from "@/hooks/useObjects";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type ShortAnswerQuestionsProps = {
  questions: {
    title: string;
    type?: string;
    fontSize?: number;
    isGameMode?: boolean;
    gameTimeLimit?: number;
  };
  feedback?: FeedbackType;
  activityId?: number;
  studentProfileId?: number;
  parentAccountId?: number;
  sessionId?: number;
  autoSaveAnswers?: boolean;
};

type Question = {
  id: number;
  question: string;
  answer: string;
  image?: string | null;
};

const ShortAnswerQuestions = ({
  questions: {
    title,
    fontSize,
    type,
    isGameMode = false,
    gameTimeLimit = 300, // 5 minutes default
  },
  feedback,
}: ShortAnswerQuestionsProps) => {
  // Fetch objects for the activity
  const { objects, loading, error, refetch } = useObjects({
    type: type || null,
    limit: 10,
    autoFetch: true,
  });

  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [feedbacks, setFeedbacks] = useState<{ [key: number]: boolean }>({});
  const [showResults, setShowResults] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [completedObjectIds, setCompletedObjectIds] = useState<number[]>([]);

  const { playSound } = useSoundEffects();

  // Generate questions from objects
  const generateQuestions = useCallback(() => {
    if (!objects || objects.length < 1) return;

    // Filter out invalid objects and create questions
    const validQuestions: Question[] = objects
      .filter((obj) => {
        // Only include objects that have both a name and either syllables or a valid name
        return (
          obj.name &&
          obj.name.trim() !== "" &&
          ((obj.syllables && obj.syllables.trim() !== "") ||
            obj.name.trim() !== "")
        );
      })
      .map((obj) => ({
        id: obj.id,
        question: (obj.syllables && obj.syllables.trim()) || obj.name, // Use syllables if available and not empty, otherwise use name
        answer: obj.name,
        image: getImageUrl(
          obj.imagePath && obj.imagePath.trim() !== ""
            ? obj.imagePath
            : undefined,
          true,
        ),
      })); // Already limited by fetch limit
    setGameQuestions(shuffle(validQuestions));
  }, [objects]);

  // Generate questions when objects are loaded
  useEffect(() => {
    if (!loading && objects.length > 0) {
      generateQuestions();
    }
  }, [loading, objects, generateQuestions]);

  const handleTimeUp = useCallback(() => {
    if (!gameComplete) {
      handleCheckAllAnswers();
    }
  }, [gameComplete]);

  const handleGameComplete = useCallback((stats: GameStats) => {
    setGameComplete(true);
    // setShowResults(true);
  }, []);

  // Check if all questions have been answered
  const allQuestionsAnswered = gameQuestions.every((_, index) => {
    const answer = answers[index];
    return answer && answer.trim() !== "";
  });

  // Custom reset function that also shuffles questions
  const handleResetWithShuffle = () => {
    setScore(0);
    setAllAnswered(false);
    setCheckedItems([]);
    setAnswers({});
    setFeedbacks({});
    setShowResults(false);
    setGameComplete(false);
    setCompletedQuestions(new Set());
    setIncorrectQuestions(new Set());

    if (isGameMode) {
      // Track completed objects and refetch new ones
      const currentObjectIds = objects.map((obj) => obj.id);
      setCompletedObjectIds((prev) => [...prev, ...currentObjectIds]);
      refetch([...completedObjectIds, ...currentObjectIds]);
    } else {
      // Regenerate questions from existing objects
      generateQuestions();
    }
  };

  const checkAnswer = (userAnswer: string, correctAnswer: string): boolean => {
    return (
      userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    );
  };

  // Custom check function for all questions
  const handleCheckAllAnswers = async () => {
    let newScore = 0;
    const newFeedbacks: { [key: number]: boolean } = {};
    const newCheckedItems: number[] = [];
    // const timeSpent = Date.now() - startTime;

    gameQuestions.forEach((question, index) => {
      const userAnswer = answers[index] || "";
      const isCorrect = checkAnswer(userAnswer, question.answer);

      newFeedbacks[index] = isCorrect;
      newCheckedItems.push(index);

      // Add to completed questions
      setCompletedQuestions((prev) => new Set([...prev, index]));

      if (!isCorrect) {
        setIncorrectQuestions((prev) => new Set([...prev, index]));
      }

      if (isCorrect) {
        newScore++;
      }
    });

    setScore(newScore);
    setFeedbacks(newFeedbacks);
    setCheckedItems(newCheckedItems);
    setAllAnswered(true);
    setGameComplete(true);

    // Play sound based on overall performance
    playSound(newScore === gameQuestions.length ? "success" : "failure");
  };

  // Create debounced version of the answer checking logic (for future auto-save if needed)
  const debouncedCheckAndSave = useCallback(
    debounce((index: number, value: string) => {
      // Future implementation for auto-save
    }, 1000),
    [],
  );

  const handleInputChange = (index: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: value,
    }));

    debouncedCheckAndSave(index, value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-500">
          Error loading questions: {error}
        </div>
      </div>
    );
  }

  if (gameQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">No questions available</div>
      </div>
    );
  }

  return (
    <GameModeWrapper
      isGameMode={isGameMode}
      totalQuestions={gameQuestions.length}
      completedQuestions={completedQuestions}
      incorrectQuestions={incorrectQuestions}
      totalTimeLimit={gameTimeLimit}
      onTimeUp={handleTimeUp}
      onGameComplete={handleGameComplete}
      showTimer={isGameMode}
      showProgress={isGameMode}
    >
      <div className="h-full flex flex-col">
        <ActivityTitle title={title} />

        <div className="flex flex-col h-full bg-picton-blue-100 gap-2">
          <div
            className="flex-1 overflow-y-auto space-y-4 py-4"
            style={{
              fontSize: fontSize ? `${fontSize}px` : "20px",
            }}
          >
            {gameQuestions.map((q, i) => {
              const actualIndex = i;

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={cn("rounded-lg min-h-[80px] flex items-center", {
                    "bg-picton-blue-50": !checkedItems.includes(actualIndex),
                    "bg-lemon-50 text-lemon-700":
                      checkedItems.includes(actualIndex),
                    "bg-green-100 text-green-700": feedbacks[actualIndex],
                    "bg-red-100 text-red-700": feedbacks[actualIndex] === false,
                  })}
                >
                  <div className="px-4 py-2 flex items-center justify-between w-full">
                    <div>
                      <span className="mr-2 md:mr-4 font-medium text-gray-600">
                        {i + 1}.
                      </span>
                      {q.image && (
                        <div className="h-28 mr-4">
                          <img
                            src={q.image}
                            alt={q.question}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <div className="inline-flex items-center flex-1 gap-4">
                        <span className="font-medium">{q.question}</span>
                        <span
                          className="inline-flex flex-col mx-1"
                          style={{ width: "150px" }}
                        >
                          <Input
                            type="text"
                            value={answers[actualIndex] || ""}
                            onChange={(e) =>
                              handleInputChange(actualIndex, e.target.value)
                            }
                            disabled={checkedItems.includes(actualIndex)}
                            placeholder=""
                            className="min-w-0 px-2 border-none bg-transparent text-center focus:outline-none"
                            style={{ maxWidth: "320px" }}
                          />
                          <div
                            className={cn(
                              "border-b border-dashed border-picton-blue-700",
                              {
                                "border-lemon-700":
                                  checkedItems.includes(actualIndex),
                              },
                            )}
                          />
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {checkedItems.includes(actualIndex) && (
                        <>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={cn(
                              "flex items-center justify-center rounded-full p-1",
                              feedbacks[actualIndex]
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600",
                            )}
                          >
                            {feedbacks[actualIndex] ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </motion.div>
                          {feedback === "wrong-correct-answers" &&
                            feedbacks[actualIndex] === false && (
                              <div className="text-sm text-red-600 font-medium">
                                Answer: {q.answer}
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Single Check Answers Button */}
          {showResults ? (
            <ActivityResults
              score={score}
              total={gameQuestions.length}
              onRestart={handleResetWithShuffle}
            />
          ) : (
            <div className="relative flex justify-end">
              <Button
                disabled={!allQuestionsAnswered || allAnswered}
                onClick={handleCheckAllAnswers}
                variant="brand-lemon"
                size="lg"
              >
                {allAnswered ? "Answers Checked" : "Check Answers"}
              </Button>
            </div>
          )}
        </div>

        <ActivityResultsAlertDialog
          score={score}
          total={gameQuestions.length}
          open={allAnswered && !showResults}
          onOpenChange={(open) => {
            if (!open) {
              setShowResults(true);
            }
          }}
        />
      </div>
    </GameModeWrapper>
  );
};

export default ShortAnswerQuestions;
