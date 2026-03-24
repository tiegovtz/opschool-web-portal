"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";

// Local imports
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import { Input } from "../../../../../tie_open_school_primary_frontend/components/ui/inputs/input";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import { cn, shuffle, getImageUrl } from "@/lib/utils";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import DNDContext from "@/components/layout/dnd-context";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { ActivityType, FeedbackType } from "@/lib/types/activity-types";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";
import { useObjects } from "@/hooks/useObjects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TItemsLabellingProps = {
  questions: {
    title: string;
    notes: string;
    algorithm: ActivityType;
    isGameMode?: boolean;
    type?: string;
    gameTimeLimit?: number;
    questions: {
      image: string;
      answer: string;
      id?: number;
    }[];
  };
  feedback: FeedbackType;
};

// Define a type for our option objects
type AnswerOption = {
  id: string;
  value: string;
  originalIndex: number;
};

const answerChecker = new AnswerChecker();

const ItemsLabelling = ({
  questions: {
    questions: originalQuestions,
    title,
    algorithm,
    isGameMode,
    type,
    gameTimeLimit,
  },
  feedback,
}: TItemsLabellingProps) => {
  // State to track completed objects for replay functionality
  const [completedObjectIds, setCompletedObjectIds] = useState<number[]>([]);

  // Fetch objects for game mode
  const { objects, loading, error, refetch } = useObjects({
    type: isGameMode ? type || null : null,
    limit: 9,
  });

  // Use fetched objects if in game mode, otherwise use provided questions
  const gameQuestions = isGameMode
    ? objects.map((obj) => ({
        image: obj.imagePath ? getImageUrl(obj.imagePath, true) : "",
        answer: obj.name.toLowerCase(),
        id: obj.id,
      }))
    : originalQuestions;

  // Add state for shuffled questions
  const [questions, setQuestions] = useState(() => shuffle([...gameQuestions]));
  const [isComplete, setIsComplete] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<number, boolean>>({});
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(
    new Set()
  );
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [timeUp, setTimeUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // State for text input mode
  const [textAnswers, setTextAnswers] = useState<string[]>(
    Array(questions.length).fill("")
  );

  // State for drag and drop mode
  const [answers, setAnswers] = useState<{
    [key: string]: { value: string; optionId: string };
  }>({});

  // Create uniquely identifiable options
  const initialOptions = questions.map((q, idx) => ({
    id: `option-${idx}`,
    value: q.answer,
    originalIndex: idx,
  }));

  const [shuffledOptions, setShuffledOptions] = useState<AnswerOption[]>(
    shuffle([...initialOptions])
  );

  const { playSound } = useSoundEffects();

  // Check if we're using drag and drop mode (only for non-game mode)
  const isDragMode =
    !isGameMode && algorithm === ActivityType.ItemsLabelingWithClues;

  // Check if activity is disabled (completed or timed out)
  const isActivityDisabled = isComplete || timeUp || gameComplete;

  // Update questions when objects are loaded in game mode
  useEffect(() => {
    if (isGameMode && !loading && gameQuestions.length > 0) {
      const newQuestions = shuffle([...gameQuestions]);
      setQuestions(newQuestions);
      setTextAnswers(Array(newQuestions.length).fill(""));

      // Reset game state when new objects are loaded
      setIsComplete(false);
      setShowResults(false);
      setFeedbacks({});
      setCompletedQuestions(new Set());
      setIncorrectQuestions(new Set());
      setGameComplete(false);
      setTimeUp(false);
      setIsResetting(false);
      setShowSubmitButton(false);
    }
  }, [isGameMode, loading, objects]);

  // Function to shuffle questions and answers for drag mode
  const shuffleQuestions = () => {
    const questionsToShuffle = isGameMode ? gameQuestions : originalQuestions;
    const shuffledQuestions = shuffle([...questionsToShuffle]);
    setQuestions(shuffledQuestions);

    if (isDragMode) {
      // Create options from the questions' answers
      const options = shuffledQuestions.map((q, idx) => ({
        id: `option-${idx}`,
        value: q.answer,
        originalIndex: idx,
      }));
      setShuffledOptions(shuffle([...options]));
      setAnswers({});
    } else {
      setTextAnswers(Array(shuffledQuestions.length).fill(""));
    }
  };

  const handleSubmit = () => {
    if (isActivityDisabled) return; // Don't allow submit when activity is disabled

    // Calculate feedbacks for each answer
    const newFeedbacks: Record<number, boolean> = {};
    const newCompletedQuestions = new Set<number>();
    // const newIncorrectQuestions = new Set<number>();

    if (isDragMode) {
      questions.forEach((question, index) => {
        const userAnswer = answers[index]?.value || "";
        console.log(answers[index]);
        const isCorrect = answerChecker.checkAnswer(userAnswer, {
          strictMode: true,
          acceptedAnswers: [question.answer],
        }).isCorrect;

        newFeedbacks[index] = isCorrect;

        newCompletedQuestions.add(index);
        // if (isCorrect) {
        // } else {
        //   newIncorrectQuestions.add(index);
        // }
      });
    } else {
      questions.forEach((question, index) => {
        const userAnswer = textAnswers[index];
        const isCorrect = answerChecker.checkAnswer(userAnswer, {
          strictMode: true,
          acceptedAnswers: [question.answer],
        }).isCorrect;
        newFeedbacks[index] = isCorrect;

        newCompletedQuestions.add(index);
        // if (isCorrect) {
        // } else {
        //   newIncorrectQuestions.add(index);
        // }
      });
    }

    setFeedbacks(newFeedbacks);
    setCompletedQuestions(newCompletedQuestions);
    // setIncorrectQuestions(newIncorrectQuestions);
    setIsComplete(true);
    setShowResults(false); // Show dialog first, then results after dialog close
    playSound("success");
  };

  useEffect(() => {
    if (isDragMode) {
      // Check if all questions have answers
      const answeredCount = Object.keys(answers).length;
      if (answeredCount === questions.length) {
        handleSubmit();
      }
    } else {
      // In input mode, check if all inputs have text
      const allAnswered = textAnswers.every((answer) => answer.trim() !== "");
      setShowSubmitButton(allAnswered);
    }
  }, [answers, textAnswers, isDragMode, questions.length]);

  const handleInputChange = (index: number, value: string) => {
    if (isActivityDisabled) return; // Don't allow input when activity is disabled

    const newAnswers = [...textAnswers];
    newAnswers[index] = value;
    setTextAnswers(newAnswers);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isActivityDisabled) return; // Don't allow drag when activity is disabled

    const { active, over } = event;

    if (!over) return;

    const activeIdParts = active.id.toString().split("%");
    const dropQuestionIndex = over.id.toString();

    let activeOptionId: string;
    let activeOptionValue: string;

    // If dragging from a question (has more parts), get the original option info
    if (activeIdParts.length > 1) {
      const sourceQuestionIndex = activeIdParts[0];
      // Get the original option info from the answer that's currently in the source question
      const sourceAnswer = answers[sourceQuestionIndex];
      if (sourceAnswer) {
        activeOptionId = sourceAnswer.optionId;
        activeOptionValue = sourceAnswer.value;
      } else {
        // Fallback if somehow there's no answer in the source
        activeOptionId = activeIdParts[0];
        activeOptionValue = activeIdParts[1];
      }
    } else {
      // Normal drag from options pool
      activeOptionId = activeIdParts[0];
      const option = shuffledOptions.find((opt) => opt.id === activeOptionId);
      activeOptionValue = option?.value || "";
    }

    const newAnswers = { ...answers };

    // Check if we're dragging from an answered question
    const isDraggingFromQuestion = activeIdParts.length > 1;

    if (isDraggingFromQuestion) {
      // Get the source question index (where we're dragging from)
      const sourceQuestionIndex = activeIdParts[0];

      // If dragging to a different question, remove from source
      if (sourceQuestionIndex !== dropQuestionIndex) {
        delete newAnswers[sourceQuestionIndex];
      }
    }

    // Check if target question already has an answer
    if (newAnswers[dropQuestionIndex]) {
      // If it does, we need to remove it to prevent "used up" options
      delete newAnswers[dropQuestionIndex];
    }

    // Also check if this specific option is used in any other question
    const previousQuestionIndex = Object.entries(newAnswers).find(
      ([, answer]) => answer.optionId === activeOptionId
    )?.[0];

    if (previousQuestionIndex) {
      delete newAnswers[previousQuestionIndex];
    }

    // Update answers with the new answer
    newAnswers[dropQuestionIndex] = {
      value: activeOptionValue,
      optionId: activeOptionId,
    };
    setAnswers(newAnswers);

    // Check if this was the last item to be placed
    // const allQuestionsAnswered =
    //   Object.keys(newAnswers).length === questions.length;

    // if (allQuestionsAnswered && isDragMode) {
    //   // If all questions are answered and we're in drag mode, auto-submit
    //   setTimeout(() => {
    //     handleSubmit();
    //   }, 500); // Small delay for better UX
    // }
  };

  const getAvailableOptions = () => {
    // Get a list of all option IDs currently used in answers
    const usedOptionIds = Object.values(answers).map(
      (answer) => answer.optionId
    );

    // Return options that are not currently placed in any question
    return shuffledOptions.filter(
      (option) => !usedOptionIds.includes(option.id)
    );
  };

  const handleRestart = () => {
    // This is called when user clicks "Play Again" or "Try Again" from ActivityResults
    // Set resetting flag first to prevent completion checks
    setIsResetting(true);

    // Reset game state immediately for both modes to prevent dialog re-triggering
    setIsComplete(false);
    setGameComplete(false);
    setTimeUp(false);
    setShowResults(false);
    setFeedbacks({});
    setCompletedQuestions(new Set());
    setIncorrectQuestions(new Set());
    setShowSubmitButton(false);

    if (isGameMode) {
      // Track completed objects before fetching new ones
      const newCompletedIds = objects.map((obj) => obj.id);
      const updatedCompletedIds = [
        ...new Set([...completedObjectIds, ...newCompletedIds]),
      ];
      setCompletedObjectIds(updatedCompletedIds);

      // For game mode, fetch new objects excluding completed ones
      refetch(updatedCompletedIds);
    } else {
      // For regular mode, use existing questions
      shuffleQuestions();
    }

    // Clear resetting flag after a brief delay to ensure state has settled
    setTimeout(() => {
      setIsResetting(false);
    }, 100);
  };

  // Handle game time up
  const handleGameTimeUp = () => {
    if (!isComplete && !timeUp) {
      setTimeUp(true);
      // Submit current answers to show feedback
      handleSubmit();
      playSound("failure");
    }
  };

  // Handle game completion from timer
  const handleGameComplete = (stats: GameStats) => {
    if (!isComplete && !timeUp) {
      setIsComplete(true);
      setShowResults(false); // Show dialog first, then results after dialog close
    }
  };

  // Calculate score from feedbacks
  const score = Object.values(feedbacks).filter(Boolean).length;

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

  return (
    <GameModeWrapper
      isGameMode={isGameMode || false}
      totalQuestions={questions.length}
      completedQuestions={completedQuestions}
      incorrectQuestions={incorrectQuestions}
      totalTimeLimit={gameTimeLimit}
      onTimeUp={handleGameTimeUp}
      onGameComplete={handleGameComplete}
      showTimer={isGameMode || false}
      showProgress={isGameMode || false}
      className="h-full"
    >
      <div className="h-full flex flex-col">
        <ActivityTitle title={title} />

        <div className="flex-1 flex gap-4">
          <div className="flex flex-col w-full gap-4 h-full">
            {isDragMode ? (
              <DNDContext onDragEnd={handleDragEnd}>
                <div className="bg-picton-blue-50 p-4 h-full flex flex-col">
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 mb-4 h-full">
                    {questions.map((question, index) => {
                      const isCorrect = feedbacks[index] === true;
                      const hasResult =
                        isComplete && feedbacks[index] !== undefined;

                      return (
                        <div
                          key={index}
                          className={cn(
                            "flex flex-col gap-4 items-center p-4 rounded-lg",
                            hasResult &&
                              isCorrect &&
                              "bg-green-50 border-2 border-green-200",
                            hasResult &&
                              !isCorrect &&
                              "bg-red-50 border-2 border-red-200",
                            !hasResult && "bg-transparent"
                          )}
                        >
                          <div className="flex justify-between items-center w-full">
                            <img
                              src={question.image}
                              alt={question.answer}
                              className="w-40 h-40 object-contain grow"
                            />
                            {hasResult && (
                              <div
                                className={cn(
                                  "flex items-center justify-center rounded-full p-1 ml-2",
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
                            )}
                          </div>

                          <div className="flex flex-col items-center w-full">
                            <Droppable
                              id={index.toString()}
                              data={{
                                type: "question",
                                questionIndex: index,
                              }}
                              className="w-full"
                            >
                              {answers[index] ? (
                                <Draggable
                                  id={`${index}%${answers[index].value}`}
                                  data={{
                                    type: "placed-option",
                                    questionIndex: index,
                                    optionId: answers[index].optionId,
                                  }}
                                  className={cn(
                                    "p-2 rounded w-full text-center cursor-move text-base",
                                    hasResult &&
                                      isCorrect &&
                                      "bg-green-100 text-green-700",
                                    hasResult &&
                                      !isCorrect &&
                                      "bg-red-100 text-red-700",
                                    !hasResult && "bg-lemon-100 text-lemon-700",
                                    isComplete &&
                                      "pointer-events-none cursor-default"
                                  )}
                                >
                                  {answers[index].value}
                                </Draggable>
                              ) : (
                                <div className="min-h-[40px] w-full bg-picton-blue-100 border border-picton-blue-200 flex items-center justify-center rounded border-dashed" />
                              )}
                            </Droppable>
                            {hasResult &&
                              !isCorrect &&
                              feedback === "wrong-correct-answers" && (
                                <div className="mt-2 text-center">
                                  <p className="text-sm text-gray-500">
                                    Correct answer:
                                  </p>
                                  <p className="text-green-600 font-medium">
                                    {question.answer}
                                  </p>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!isComplete && (
                    <div className="grid grid-cols-3 gap-4">
                      {getAvailableOptions().map((option) => (
                        <Draggable
                          key={option.id}
                          id={option.id}
                          data={{
                            type: "option",
                            originalIndex: option.originalIndex,
                          }}
                          className="p-2 rounded bg-picton-blue-200 text-picton-blue-600 text-center hover:bg-picton-blue-300 cursor-move"
                        >
                          {option.value}
                        </Draggable>
                      ))}
                    </div>
                  )}
                </div>
              </DNDContext>
            ) : (
              <div className="bg-picton-blue-50 p-4 h-full">
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 h-full">
                  {questions.map((question, index) => {
                    const isCorrect = feedbacks[index] === true;
                    const hasResult =
                      isComplete && feedbacks[index] !== undefined;

                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex flex-col gap-4 items-center rounded-lg p-4 relative",
                          hasResult &&
                            isCorrect &&
                            "bg-green-50 border-2 border-green-200",
                          hasResult &&
                            !isCorrect &&
                            "bg-red-50 border-2 border-red-200",
                          !hasResult && "bg-picton-blue-100"
                        )}
                      >
                        <img
                          src={question.image}
                          alt={question.answer}
                          className="min-w-40 h-40 object-contain grow"
                        />
                        {hasResult && (
                          <div
                            className={cn(
                              "flex items-center justify-center rounded-full p-1 ml-2 absolute top-2 right-2",
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
                        )}

                        <div className="flex flex-col gap-2 items-center w-full">
                          <Input
                            type="text"
                            value={textAnswers[index]}
                            onChange={(e) =>
                              handleInputChange(index, e.target.value)
                            }
                            disabled={isActivityDisabled}
                            className={cn(
                              "border-b-2 md:w-3/5 text-center border-x-0 border-t-0 rounded-none text-lg border-dashed bg-transparent focus-visible:ring-transparent p-2",
                              hasResult &&
                                isCorrect &&
                                "text-green-600 border-green-600",
                              hasResult &&
                                !isCorrect &&
                                "text-red-600 border-red-600",
                              !hasResult &&
                                "text-picton-blue-600 border-picton-blue-600",
                              isActivityDisabled && "pointer-events-none"
                            )}
                          />
                          {hasResult &&
                            !isCorrect &&
                            feedback === "wrong-correct-answers" && (
                              <p className="text-green-600 text-sm">
                                {`Correct: ${question.answer}`}
                              </p>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show button only when not in drag mode or not all answers are placed */}
            {showSubmitButton &&
              !isComplete &&
              (!isDragMode ||
                Object.keys(answers).length < questions.length) && (
                <Button
                  onClick={handleSubmit}
                  className="w-fit ml-auto"
                  disabled={isActivityDisabled}
                >
                  Check Answers
                </Button>
              )}

            {/* Show results section at the bottom when complete */}
            {showResults && (
              <div className="bg-picton-blue-50 p-4">
                <ActivityResults
                  score={score}
                  total={questions.length}
                  onRestart={handleRestart}
                />
              </div>
            )}
          </div>
        </div>

        <ActivityResultsAlertDialog
          score={timeUp ? 0 : score}
          total={questions.length}
          open={isComplete && !showResults}
          onOpenChange={(open) => {
            if (!open) {
              setShowResults(true);
            }
          }}
          completionMessage={
            timeUp
              ? "⏰ Time's up! Don't worry, you can try again with new items. Keep practicing to improve your speed!"
              : undefined
          }
        />
      </div>
    </GameModeWrapper>
  );
};

export default ItemsLabelling;
