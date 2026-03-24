import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import { FeedbackType } from "@/lib/types/activity-types";
import { compareAnswers } from "@/lib/utils/answer-processing";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TCompleteSentencesWithTwoClauses = {
  feedback: FeedbackType;
  questions: {
    title: string;
    fontSize?: string;
    questions: {
      word: string;
      answer: string | string[];
    }[];
  };
};

const CompleteSentencesWithTwoClausesActivity = ({
  feedback,
  questions,
}: TCompleteSentencesWithTwoClauses) => {
  const [shuffledQuestions, setShuffledQuestions] = useState([
    ...questions.questions,
  ]);
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [allChecked, setAllChecked] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [feedbacks, setFeedbacks] = useState<{ [key: number]: boolean }>({});
  const [showResults, setShowResults] = useState(false);

  const { playSound } = useSoundEffects();

  // Function to shuffle questions
  const shuffleQuestions = () => {
    const shuffled = shuffle([...questions.questions]);
    setShuffledQuestions(shuffled);
  };

  // Initialize with shuffled questions
  useEffect(() => {
    shuffleQuestions();
  }, [questions.questions]);

  // Check if all questions have answers
  useEffect(() => {
    const hasAllAnswers = shuffledQuestions.every(
      (_, index) => answers[index]?.trim().length > 0,
    );
    setAllAnswered(hasAllAnswers);
  }, [answers, shuffledQuestions]);

  const handleCheckAll = () => {
    let correctCount = 0;
    const newFeedbacks: { [key: number]: boolean } = {};

    shuffledQuestions.forEach((question, index) => {
      const userAnswer = answers[index]?.trim().toLowerCase();
      const correctAnswer = question.answer;

      const isCorrect = compareAnswers(userAnswer, correctAnswer, {
        preserveSpaces: true,
      });

      newFeedbacks[index] = isCorrect;
      if (isCorrect) {
        correctCount++;
      }
    });

    setFeedbacks(newFeedbacks);
    setScore(correctCount);
    setAllChecked(true);

    // Play sound based on overall performance
    const percentage = (correctCount / shuffledQuestions.length) * 100;
    if (percentage === 100) {
      playSound("success");
    } else if (percentage >= 70) {
      playSound("correct");
    } else {
      playSound("failure");
    }
  };

  const handleInputChange = (index: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const resetGame = () => {
    shuffleQuestions();
    setAllAnswered(false);
    setAllChecked(false);
    setScore(0);
    setAnswers({});
    setFeedbacks({});
    setShowResults(false);
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
          <div className="grid grid-cols-2 gap-4 py-4 flex-1 overflow-y-auto">
            {shuffledQuestions.map((question, index) => (
              <div
                key={index}
                className={cn(
                  "bg-picton-blue-50 h-fit flex flex-col rounded-lg p-6",
                  {
                    "bg-green-100 text-green-700":
                      allChecked && feedbacks[index],
                    "bg-red-100 text-red-700":
                      allChecked && feedbacks[index] === false,
                  },
                )}
              >
                <div className="flex flex-col justify-between h-full">
                  <p className="mb-4">{question.word}</p>
                  <div>
                    <Input
                      value={answers[index] || ""}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      disabled={allChecked}
                      className="px-2 border-none bg-transparent text-center"
                      // placeholder="Complete the sentence..."
                    />
                    <div
                      className={cn(
                        "w-full border-b border-dashed border-picton-blue-700 mt-2",
                        {
                          "border-green-700": allChecked && feedbacks[index],
                          "border-red-700":
                            allChecked && feedbacks[index] === false,
                        },
                      )}
                    />
                  </div>
                </div>
                {allChecked && (
                  <div className="flex justify-center mt-4">
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-full p-1",
                        feedbacks[index]
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600",
                      )}
                    >
                      {feedbacks[index] ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <X className="h-6 w-6" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Check Answers Button */}
          {!allChecked && (
            <Button
              onClick={handleCheckAll}
              disabled={!allAnswered}
              variant="brand-lemon"
              className="ml-auto text-lg py-3"
            >
              Check Answers
            </Button>
          )}

          {/* View Results Button */}
          {allChecked && (
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
        <div
          className="flex flex-col h-full bg-picton-blue-100 p-6 overflow-y-auto"
          style={{
            fontSize: questions.fontSize ? `${questions.fontSize}px` : "20px",
          }}
        >
          <div className="bg-picton-blue-50 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-4 mb-8">
              {shuffledQuestions.map((question, idx) => {
                const userAnswer = answers[idx] || "";
                const isCorrect = compareAnswers(userAnswer, question.answer, {
                  preserveSpaces: true,
                });

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
                      <p className="font-medium">{question.word}</p>
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

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Your answer:</p>
                        <p
                          className={
                            !isCorrect ? "text-red-600" : "text-green-600"
                          }
                        >
                          {userAnswer || "(no answer)"}
                        </p>
                      </div>
                      {feedback === "wrong-correct-answers" && !isCorrect && (
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
              onRestart={resetGame}
            />
          </div>
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={shuffledQuestions.length}
        open={allChecked && !showResults}
        onOpenChange={(open) => {
          if (!open) setShowResults(true);
        }}
      />
    </div>
  );
};

export default CompleteSentencesWithTwoClausesActivity;
