import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

interface TwoUnitsQuestion {
  id: number;
  question: string; // e.g. "shs 625445 50 cts + shs 357223 85 cts = ___"
  answer: string; // e.g. "shs 982669 35 cts"
}

interface TwoUnitsOperationActivityProps {
  questions: TwoUnitsQuestion[];
  feedback?: "wrong-correct" | "wrong-correct-answers" | "none";
  isExamMode?: boolean;
  onActivityComplete?: (
    score: number,
    totalQuestions: number,
    userAnswers: any[],
  ) => void;
}

// Component to render currency operations with proper mathematical layout
const CurrencyOperationDisplay: React.FC<{ question: string }> = ({
  question,
}) => {
  const parseOperation = () => {
    // Parse the question string to extract the mathematical operation
    // Example: "shs 14955 50 cts + shs 357223 85 cts = ___"
    const operationMatch = question.match(
      /shs\s+(\d+)\s+(\d+)\s+cts\s*([+\-])\s*shs\s+(\d+)\s+(\d+)\s+cts\s*=\s*___/,
    );

    if (operationMatch) {
      const [, shs1, cts1, operator, shs2, cts2] = operationMatch;
      return {
        firstNumber: { shs: shs1, cts: cts1 },
        operator,
        secondNumber: { shs: shs2, cts: cts2 },
      };
    }
    return null;
  };

  const operation = parseOperation();

  if (!operation) {
    // Fallback to original display if parsing fails
    return <div className="text-lg text-center">{question}</div>;
  }

  return (
    <div className="flex flex-col items-center gap-2 text-lg font-mono">
      {/* First row */}
      <div className="flex items-center justify-end w-full max-w-[200px]">
        <span className="text-gray-600 mr-2">shs</span>
        <span className="text-right w-16">{operation.firstNumber.shs}</span>
        <span className="text-right w-12">{operation.firstNumber.cts}</span>
        <span className="text-gray-600 ml-2">cts</span>
      </div>

      {/* Second row with operator */}
      <div className="flex items-center justify-end w-full max-w-[200px]">
        <span className="text-xl font-bold mr-1">{operation.operator}</span>
        <span className="text-gray-600 mr-2">shs</span>
        <span className="text-right w-16">{operation.secondNumber.shs}</span>
        <span className="text-right w-12">{operation.secondNumber.cts}</span>
        <span className="text-gray-600 ml-2">cts</span>
      </div>

      {/* Line separator */}
      <div className="w-full max-w-[200px] border-b-2 border-gray-400"></div>
    </div>
  );
};

// Component for currency input (shs and cts)
const CurrencyInput: React.FC<{
  value: { shs: string; cts: string };
  onChange: (val: { shs: string; cts: string }) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  return (
    <div className="flex items-center justify-center w-full max-w-[200px] gap-4 font-mono">
      <div className="flex items-center justify-center w-full max-w-[200px] gap-1 font-mono">
        <span className="text-gray-600 mr-2">shs</span>
        <Input
          type="text"
          value={value.shs}
          onChange={(e) => onChange({ ...value, shs: e.target.value })}
          disabled={disabled}
          className="w-16 border-picton-blue-700 border-dashed text-right border-b-2 border-x-0 border-t-0 rounded-none bg-transparent focus-visible:ring-transparent px-1"
          inputMode="numeric"
        />
      </div>

      <div className="flex items-center justify-center w-full max-w-[200px] gap-1 font-mono">
        <Input
          type="text"
          value={value.cts}
          onChange={(e) => onChange({ ...value, cts: e.target.value })}
          disabled={disabled}
          className="w-12 text-right border-picton-blue-700 border-dashed border-b-2 border-x-0 border-t-0 rounded-none bg-transparent focus-visible:ring-transparent px-1"
          inputMode="numeric"
        />
        <span className="text-gray-600 ml-2">cts</span>
      </div>
    </div>
  );
};

const TwoUnitsOperationActivity: React.FC<TwoUnitsOperationActivityProps> = ({
  questions,
  feedback = "wrong-correct",
  onActivityComplete,
}) => {
  const [userAnswers, setUserAnswers] = useState<
    { shs: string; cts: string }[]
  >(Array(questions.length).fill({ shs: "", cts: "" }));
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Parse answer string to extract shs and cts values
  const parseAnswer = (answer: string) => {
    const match = answer.match(/shs\s+(\d+)\s+(\d+)\s+cts/);
    if (match) {
      return { shs: match[1], cts: match[2] };
    }
    return { shs: "", cts: "" };
  };

  const checkAnswer = (
    userAnswer: { shs: string; cts: string },
    correctAnswer: string,
  ) => {
    const correct = parseAnswer(correctAnswer);
    return (
      userAnswer.shs.trim() === correct.shs &&
      userAnswer.cts.trim() === correct.cts
    );
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (onActivityComplete) {
      const score = questions.reduce(
        (acc, q, i) => acc + (checkAnswer(userAnswers[i], q.answer) ? 1 : 0),
        0,
      );
      onActivityComplete(score, questions.length, userAnswers);
    }
  };

  // Check if all answers are filled
  const allAnswered = userAnswers.every(
    (answer) => answer.shs.trim() !== "" && answer.cts.trim() !== "",
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex gap-4">
        <div className="flex flex-col w-full gap-4 h-full">
          <div className="bg-picton-blue-50 p-4 h-full">
            <div className="grid grid-cols-2 gap-6 h-full">
              {questions.map((q, idx) => {
                const isCorrect =
                  submitted && checkAnswer(userAnswers[idx], q.answer);
                const hasResult = submitted;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "flex flex-col gap-4 items-center rounded-lg p-6 relative",
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
                    <div className="text-center w-full">
                      <CurrencyOperationDisplay question={q.question} />
                    </div>

                    {/* Currency Input */}
                    <CurrencyInput
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
                            {q.answer}
                          </p>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          {!submitted && allAnswered && (
            <Button onClick={handleSubmit} className="w-fit ml-auto">
              Check Answers
            </Button>
          )}

          {/* Show results section at the bottom when complete */}
          {showResults && (
            <div className="bg-picton-blue-50 p-4">
              <ActivityResults
                score={questions.reduce(
                  (acc, q, i) =>
                    acc + (checkAnswer(userAnswers[i], q.answer) ? 1 : 0),
                  0,
                )}
                total={questions.length}
                onRestart={() => {
                  setSubmitted(false);
                  setShowResults(false);
                  setUserAnswers(
                    Array(questions.length).fill({ shs: "", cts: "" }),
                  );
                }}
              />
            </div>
          )}
        </div>
      </div>

      <ActivityResultsAlertDialog
        score={questions.reduce(
          (acc, q, i) => acc + (checkAnswer(userAnswers[i], q.answer) ? 1 : 0),
          0,
        )}
        total={questions.length}
        open={submitted && !showResults}
        onOpenChange={(open) => {
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </div>
  );
};

export default TwoUnitsOperationActivity;
