import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

// local imports
import { cn, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type CompleteSentencesByClickingProps = {
  questions: {
    title: string;
    fontSize?: string;
    questions: {
      id: number | string;
      question: string;
      options: string[];
      correctAnswer: string;
    }[];
  };
};

const CompleteSentencesByClickingActivity = ({
  questions,
}: CompleteSentencesByClickingProps) => {
  const [shuffledQuestions, setShuffledQuestions] = useState([
    ...questions.questions,
  ]);

  const shuffleQuestions = () => {
    setShuffledQuestions(shuffle([...questions.questions]));
  };

  const [crossedOptions, setCrossedOptions] = useState<{
    [key: number]: string[];
  }>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Shuffle questions on initial render
  useEffect(() => {
    shuffleQuestions();
  }, [questions.questions]);

  // Check if all questions are answered (have at least one crossed option)
  const allAnswered = useMemo(
    () =>
      Object.keys(crossedOptions).length === shuffledQuestions.length &&
      shuffledQuestions.every((_, index) => crossedOptions[index]?.length > 0),
    [crossedOptions, shuffledQuestions]
  );

  // Calculate score based on the remaining uncrossed option being the user's answer
  const score = shuffledQuestions.reduce((acc, question, index) => {
    const crossed = crossedOptions[index] || [];
    if (crossed.length === 0) return acc;
    const userAnswer =
      question.options.find((option) => !crossed.includes(option)) || "";
    return acc + (userAnswer === question.correctAnswer ? 1 : 0);
  }, 0);

  // Custom reset function that also shuffles questions
  const handleResetWithShuffle = () => {
    shuffleQuestions();
    setCrossedOptions({});
    setShowResults(false);
    setIsSubmitted(false);
  };

  const handleCheckAnswers = () => {
    setIsSubmitted(true);
    // setShowResults(true);
  };

  const handleOptionClick = (questionIndex: number, selectedOption: string) => {
    // Don't allow clicks after showing results
    if (showResults) {
      return;
    }

    const question = shuffledQuestions[questionIndex];
    const currentCrossed = crossedOptions[questionIndex] || [];
    const isCrossed = currentCrossed.includes(selectedOption);

    if (isCrossed) {
      // Remove cross from option
      setCrossedOptions((prev) => ({
        ...prev,
        [questionIndex]: currentCrossed.filter(
          (option) => option !== selectedOption
        ),
      }));
    } else {
      // Add cross to option, but only if it won't cross all options
      const uncrossedOptions = question.options.filter(
        (option) => !currentCrossed.includes(option)
      );
      if (uncrossedOptions.length > 1) {
        setCrossedOptions((prev) => ({
          ...prev,
          [questionIndex]: [...currentCrossed, selectedOption],
        }));
      }
    }
  };

  const renderQuestion = (
    question: (typeof shuffledQuestions)[0],
    questionIndex: number
  ) => {
    const parts = question.question.split("___");
    const crossed = crossedOptions[questionIndex] || [];
    const isAnswered = crossed.length > 0;
    const userAnswer = isAnswered
      ? question.options.find((option) => !crossed.includes(option)) || ""
      : "";
    const isCorrect = showResults && userAnswer === question.correctAnswer;
    const isIncorrect = showResults && userAnswer !== question.correctAnswer;

    return (
      <motion.div
        key={`question-${questionIndex}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: questionIndex * 0.1 }}
        className={cn("flex items-center p-2 md:p-4 rounded mb-2", {
          "bg-picton-blue-50": !showResults,
          "bg-green-100": showResults && isCorrect,
          "bg-red-100": showResults && isIncorrect,
        })}
      >
        <div className="flex w-full justify-between items-center">
          <p>
            {questionIndex + 1}. {"   "}
            {parts[0]}
            <span className="inline-flex gap-2">
              {question.options.map((option) => {
                const isCrossed = crossed.includes(option);
                const isUserAnswer = isAnswered && !isCrossed;
                const uncrossedCount = question.options.filter(
                  (opt) => !crossed.includes(opt)
                ).length;
                const canCross = !isCrossed && uncrossedCount > 1;

                return (
                  <span
                    key={option}
                    onClick={() => handleOptionClick(questionIndex, option)}
                    className={cn(
                      "cursor-pointer px-1 py-1 rounded transition-all",
                      {
                        "bg-picton-blue-200 hover:bg-picton-blue-300":
                          !showResults && (canCross || isCrossed),
                        "line-through text-gray-400": isCrossed,
                        "bg-lemon-200 text-lemon-700 hover:bg-lemon-300":
                          isAnswered && isUserAnswer && !showResults,
                        "bg-green-200 text-green-700":
                          showResults && isUserAnswer && isCorrect,
                        "bg-red-200 text-red-700":
                          showResults && isUserAnswer && isIncorrect,
                        "cursor-not-allowed":
                          !showResults && !canCross && !isCrossed,
                      }
                    )}
                  >
                    {option}
                  </span>
                );
              })}
            </span>
            {parts[1]}
          </p>

          {showResults && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "flex items-center justify-center rounded-full p-1",
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
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      <div
        className="flex flex-col gap-2 h-full bg-picton-blue-100 text-[20px]"
        style={{
          fontSize: questions.fontSize ? `${questions.fontSize}px` : undefined,
        }}
      >
        <div className="md:p-4 overflow-y-auto">
          {shuffledQuestions.map((question, index) =>
            renderQuestion(question, index)
          )}

          {showResults && (
            <ActivityResults
              score={score}
              total={shuffledQuestions.length}
              onRestart={handleResetWithShuffle}
              className="mt-6"
            />
          )}

          {allAnswered && !showResults && (
            <div className="ml-auto w-fit">
              <Button variant="brand-lemon" onClick={handleCheckAnswers}>
                Check Answers
              </Button>
            </div>
          )}
        </div>
      </div>

      <ActivityResultsAlertDialog
        score={score}
        total={shuffledQuestions.length}
        open={isSubmitted && !showResults}
        onOpenChange={(open) => {
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </div>
  );
};

export default CompleteSentencesByClickingActivity;
