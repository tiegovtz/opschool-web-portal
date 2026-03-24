import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";

interface FractionQuestion {
  id: number;
  question: string; // e.g. (3/10) + (5/10) =
  answers: string[]; // e.g. ["(8/10)", "(4/5)"]
}

interface FractionOperationActivityProps {
  questions: FractionQuestion[];
  feedback?: "wrong-correct" | "wrong-correct-answers" | "none";
  isExamMode?: boolean;
  onActivityComplete?: (
    score: number,
    totalQuestions: number,
    userAnswers: any[],
  ) => void;
}

const parseFraction = (str: string) => {
  // Remove brackets and split numerator/denominator
  const match = str.match(/\(([^/]+)\/(.+)\)/);
  if (match) {
    return { numerator: match[1], denominator: match[2] };
  }
  // If not a fraction, treat as whole number
  return { numerator: str.replace(/[()]/g, ""), denominator: undefined };
};

// Component to render fractions in questions
const FractionDisplay: React.FC<{ numerator: string; denominator: string }> = ({
  numerator,
  denominator,
}) => {
  return (
    <span className="inline-flex flex-col items-center mx-1 text-3xl">
      <span className="leading-none">{numerator}</span>
      <span className="border-t border-picton-blue-700 w-full"></span>
      <span className="leading-none">{denominator}</span>
    </span>
  );
};

// Component to render the question with proper fraction formatting
const QuestionDisplay: React.FC<{ question: string }> = ({ question }) => {
  const renderQuestion = () => {
    // Split the question by spaces and process each part
    const parts = question.split(/(\s+)/);

    return parts.map((part, index) => {
      // Check if this part is a fraction in parentheses
      const fractionMatch = part.match(/\((\d+)\/(\d+)\)/);
      if (fractionMatch) {
        const [, numerator, denominator] = fractionMatch;
        return (
          <FractionDisplay
            key={index}
            numerator={numerator}
            denominator={denominator}
          />
        );
      }
      // Return the part as-is (spaces, operators, etc.)
      return <span key={index}>{part}</span>;
    });
  };

  return <div className="flex items-center">{renderQuestion()}</div>;
};

const FractionInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  // For fraction input, split by '/'
  const [num, setNum] = useState("");
  const [den, setDen] = useState("");

  useEffect(() => {
    if (value.includes("/")) {
      const [n, d] = value.split("/");
      setNum(n);
      setDen(d);
    } else {
      setNum(value);
      setDen("");
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center bg-white border-gray-400 rounded-lg w-16">
      <input
        className="text-center text-2xl font-medium border-none outline-none w-full h-10"
        value={num}
        onChange={(e) => {
          setNum(e.target.value);
          onChange(den ? `${e.target.value}/${den}` : e.target.value);
        }}
        disabled={disabled}
        inputMode="numeric"
        placeholder=""
      />
      <div className="border-t border-gray-400 w-full" />
      <input
        className="text-center text-2xl font-medium border-none outline-none w-full h-10"
        value={den}
        onChange={(e) => {
          setDen(e.target.value);
          onChange(num ? `${num}/${e.target.value}` : e.target.value);
        }}
        disabled={disabled}
        inputMode="numeric"
        placeholder=""
      />
    </div>
  );
};

const FractionOperationActivity: React.FC<FractionOperationActivityProps> = ({
  questions,
  feedback = "wrong-correct",
  isExamMode,
  onActivityComplete,
}) => {
  const [userAnswers, setUserAnswers] = useState<string[]>(
    Array(questions.length).fill(""),
  );
  const [submitted, setSubmitted] = useState(false);

  const checkAnswer = (user: string, correct: string[]) => {
    // Accept if user answer matches any correct answer (ignoring spaces and brackets)
    const normalize = (s: string) => s.replace(/[()\s]/g, "");
    const normalizedUser = normalize(user);

    // Handle special case where user enters whole number but answer expects fraction format
    const checkVariations = (userAnswer: string, correctAnswers: string[]) => {
      return correctAnswers.some((ans) => {
        const normalizedAns = normalize(ans);
        // Direct match
        if (normalizedAns === normalizedUser) return true;

        // Check if user entered a fraction that equals a whole number
        if (userAnswer.includes("/")) {
          const [num, den] = userAnswer.split("/");
          if (num && den && parseInt(num) === parseInt(den)) {
            return normalizedAns === "1";
          }
        }

        // Check if user entered whole number but answer is fraction
        if (!userAnswer.includes("/") && ans.includes("/")) {
          const match = ans.match(/\((\d+)\/(\d+)\)/);
          if (match) {
            const [, num, den] = match;
            if (parseInt(num) === parseInt(den) && userAnswer === "1") {
              return true;
            }
          }
        }

        return false;
      });
    };

    return checkVariations(user, correct);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onActivityComplete) {
      const score = questions.reduce(
        (acc, q, i) => acc + (checkAnswer(userAnswers[i], q.answers) ? 1 : 0),
        0,
      );
      onActivityComplete(score, questions.length, userAnswers);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex gap-4">
        <div className="flex flex-col w-full gap-4 h-full">
          <div className="bg-picton-blue-50 p-4 h-full">
            <div className="grid grid-cols-3 gap-6 h-full">
              {questions.map((q, idx) => {
                const isCorrect =
                  submitted && checkAnswer(userAnswers[idx], q.answers);
                const hasResult = submitted;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "flex gap-4 items-center justify-center rounded-lg p-6 relative",
                      hasResult &&
                        isCorrect &&
                        "bg-green-50 border-2 border-green-200",
                      hasResult &&
                        !isCorrect &&
                        "bg-red-50 border-2 border-red-200",
                      !hasResult && "bg-picton-blue-100",
                    )}
                  >
                    {/* Question Display */}
                    <div className="text-2xl font-medium text-center">
                      <QuestionDisplay question={q.question} />
                    </div>

                    {/* Fraction Input */}
                    <FractionInput
                      value={userAnswers[idx]}
                      onChange={(val) => {
                        const arr = [...userAnswers];
                        arr[idx] = val;
                        setUserAnswers(arr);
                      }}
                      disabled={submitted}
                    />

                    {/* Feedback Icon */}
                    {hasResult && (
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-full p-1 absolute top-2 right-2",
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
                    )}

                    {/* Show correct answer if wrong and feedback allows it */}
                    {hasResult &&
                      !isCorrect &&
                      feedback === "wrong-correct-answers" && (
                        <div className="mt-2 text-center">
                          <p className="text-sm text-gray-500">
                            Correct answer:
                          </p>
                          <p className="text-green-600 font-medium">
                            {q.answers[0]} {/* Show first correct answer */}
                          </p>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          {!submitted && (
            <div className="flex justify-end p-4">
              <Button
                // className="bg-picton-blue-500 hover:bg-picton-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium shadow-md transition-colors"
                onClick={handleSubmit}
              >
                Check Answers
              </Button>
            </div>
          )}

          {/* Score Display */}
          {submitted && feedback !== "none" && (
            <div className="bg-picton-blue-50 p-4 text-center">
              <div className="text-xl font-bold text-gray-700">
                Score:{" "}
                {questions.reduce(
                  (acc, q, i) =>
                    acc + (checkAnswer(userAnswers[i], q.answers) ? 1 : 0),
                  0,
                )}
                /{questions.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FractionOperationActivity;
