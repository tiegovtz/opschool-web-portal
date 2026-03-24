import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";

// local imports
import { cn, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TCompleteSentencesByRephrasingWithChoices = {
  feedback: FeedbackType;
  questions: {
    title: string;
    fontSize?: number;
    options: string[];
    questions: {
      question: string;
      answer: string;
    }[];
  };
};

const answerChecker = new AnswerChecker();

/**
 * @deprecated This component is deprecated and will be removed in the next major release.
 *
 * **Deprecation Details:**
 * - **Reason:** Component architecture has been redesigned for better performance and maintainability
 *
 * **Migration Guide:**
 * Please use the `CompleteSentencesByRephrasingActivity` component instead:
 * ```tsx
 * import { CompleteSentencesActivity } from '@/components/activities/complete-sentences-activity';
 * ```
 *
 * **Breaking Changes:**
 * - Props structure has been simplified
 * - Event handlers have been renamed for consistency
 * - CSS classes follow the new design system
 *
 * @see {@link CompleteSentencesActivity} - Replacement component
 * @see {@link https://docs.example.com/migration/v3} - Full migration guide
 */
const CompleteSentencesByRephrasingWithChoices = ({
  feedback,
  questions,
}: TCompleteSentencesByRephrasingWithChoices) => {
  // Add state for shuffled questions
  const [shuffledQuestions, setShuffledQuestions] = useState(
    questions.questions,
  );
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [feedbacks, setFeedbacks] = useState<{ [key: number]: boolean }>({});
  const [showResults, setShowResults] = useState(false);

  const { playSound } = useSoundEffects();

  // Custom reset handler that will shuffle questions
  const handleReset = () => {
    setShuffledQuestions(shuffle(questions.questions));
    setScore(0);
    setAllAnswered(false);
    setCheckedItems([]);
    setAnswers({});
    setFeedbacks({});
    setShowResults(false);
  };

  // Initialize with shuffled questions
  useEffect(() => {
    setShuffledQuestions(shuffle(questions.questions));
  }, [questions.questions]);

  // Check if all questions have been answered
  const allQuestionsAnswered = shuffledQuestions.every((_, index) => {
    const answer = answers[index];
    return answer && answer.trim() !== "";
  });

  // Custom check function for all questions
  const handleCheckAllAnswers = () => {
    let newScore = 0;
    const newFeedbacks: { [key: number]: boolean } = {};
    const newCheckedItems: number[] = [];

    shuffledQuestions.forEach((_, index) => {
      const userAnswer = answers[index] || "";
      const result = checkAnswer(userAnswer, index);
      const isCorrect = typeof result === "boolean" ? result : result.isCorrect;

      newFeedbacks[index] = isCorrect;
      newCheckedItems.push(index);

      if (isCorrect) {
        newScore++;
      }
    });

    setScore(newScore);
    setFeedbacks(newFeedbacks);
    setCheckedItems(newCheckedItems);
    setAllAnswered(true);

    // Play sound based on overall performance
    playSound(newScore === shuffledQuestions.length ? "success" : "failure");
  };

  const handleInputChange = (index: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const visibleQuestions = shuffledQuestions;

  const checkAnswer = (userAnswer: string, questionIndex: number) => {
    const correctAnswer = shuffledQuestions[questionIndex].answer.toLowerCase();
    return answerChecker.checkAnswer(userAnswer.toLowerCase(), {
      acceptedAnswers: [correctAnswer],
    });
  };

  const renderQuestion = (q: string, questionIndex: number) => {
    const words = q.split(" ");
    const actualIndex = questionIndex; // Use direct index since we're showing all questions

    return words.map((w, i) => {
      if (w.startsWith("___")) {
        // Calculate width based on number of underscores (multiples of 3)
        const underscoreCount = w.length;
        const widthMultiplier = underscoreCount / 3;
        const baseWidth = 200;
        const calculatedWidth = baseWidth * widthMultiplier;

        return (
          <span
            key={i}
            className="inline-flex flex-col mx-1"
            style={{ minWidth: `${calculatedWidth}px` }}
          >
            <Input
              type="text"
              value={answers[actualIndex] || ""}
              onChange={(e) => handleInputChange(questionIndex, e.target.value)}
              disabled={checkedItems.includes(actualIndex)}
              className="min-w-0 px-2 border-none bg-transparent text-center focus:outline-none"
              style={{ maxWidth: `${calculatedWidth * 1.6}px` }}
            />
            <div
              className={cn("border-b border-dashed border-picton-blue-700", {
                "border-lemon-700": checkedItems.includes(actualIndex),
              })}
            />
          </span>
        );
      }
      return (
        <span
          key={i}
          className={cn("inline-flex items-center mx-1", {
            "bg-lemon-100 text-lemon-700 px-2 py-1 rounded":
              w.includes("_") && w.split("_").length === 2,
          })}
        >
          {w.replace(/_/g, "")}
        </span>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      {!showResults ? (
        <div
          className="flex flex-col h-full bg-picton-blue-100"
          style={{
            fontSize: questions.fontSize ? `${questions.fontSize}px` : "20px",
          }}
        >
          <div className="grid gap-4 py-4 h-full grow overflow-y-auto">
            {visibleQuestions.map((q, i) => {
              const uniqueKey = `question-${i}`;
              const actualIndex = i;

              return (
                <motion.div
                  key={uniqueKey}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={cn("h-full rounded-lg", {
                    "bg-picton-blue-50": !checkedItems.includes(actualIndex),
                    "bg-lemon-50 text-lemon-700":
                      checkedItems.includes(actualIndex),
                    "bg-green-100 text-green-700": feedbacks[actualIndex],
                    "bg-red-100 text-red-700": feedbacks[actualIndex] === false,
                  })}
                >
                  <div className="p-4 flex flex-col justify-between h-full">
                    <div className="flex flex-wrap items-center">
                      {renderQuestion(q.question, i)}
                    </div>
                    <div className="flex items-center gap-2 mt-4 ml-auto">
                      {checkedItems.includes(actualIndex) && (
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
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {questions.options.filter((o) => o.trim() !== "").length > 0 && (
            <div className="py-4">
              <h2 className="text-xl mb-2">Answers</h2>
              <div className="flex flex-wrap gap-4 bg-picton-blue-200 w-fit p-2 rounded">
                {questions.options.map((o, i) => (
                  <div
                    key={i}
                    className="text-picton-blue-700  px-5 py-1 rounded"
                  >
                    {o}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Check Answers Button */}
          <Button
            disabled={!allQuestionsAnswered || allAnswered}
            onClick={handleCheckAllAnswers}
            variant="brand-lemon"
            className="w-fit ml-auto"
            size="lg"
          >
            {allAnswered ? "Answers Checked" : "Check All Answers"}
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col h-full bg-picton-blue-100 p-6 overflow-y-auto"
          style={{
            fontSize: questions.fontSize ? `${questions.fontSize}px` : "20px",
          }}
        >
          <div className="bg-picton-blue-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {shuffledQuestions.map((question, idx) => {
                const userAnswer = answers[idx] || "";
                const result = checkAnswer(userAnswer, idx);
                const isCorrect =
                  typeof result === "boolean" ? result : result.isCorrect;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-lg border",
                      isCorrect
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200",
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium">{question.question}</p>
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-full p-1",
                          isCorrect
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600",
                        )}
                      >
                        {isCorrect ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">Your answer:</p>
                        <p className={!isCorrect ? "text-red-600" : ""}>
                          {userAnswer || "(no answer)"}
                        </p>
                      </div>
                      {feedback === "wrong-correct-answers" && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Correct answer:
                          </p>
                          <p className="text-green-600">{question.answer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <ActivityResults
              score={score}
              total={shuffledQuestions.length}
              onRestart={handleReset}
            />
          </div>
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={shuffledQuestions.length}
        open={allAnswered && !showResults}
        onOpenChange={(open) => {
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </div>
  );
};

export default CompleteSentencesByRephrasingWithChoices;
