// @ts-nocheck
import { useState } from "react";

// Local imports
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import { FeedbackType } from "@/lib/types/activity-types";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { Check, X } from "lucide-react";

type CompleteSentencesWithThreeClausesProps = {
  questions: {
    title: string;
    fontSize?: string;
    algorithm:
      | "Complete sentences with three clauses"
      | "Complete sentences with four clauses";
    questions: {
      id: number | string;
      question: string;
      correctAnswers: string[];
    }[];
  };
  feedback?: FeedbackType;
};

const CompleteSentencesWithThreeClauses = ({
  questions,
  feedback = "wrong-correct-answers",
}: CompleteSentencesWithThreeClausesProps) => {
  const { algorithm, questions: questionItems } = questions;

  // Determine number of answers to fill based on algorithm
  const answerCount =
    algorithm === "Complete sentences with three clauses" ? 2 : 3;

  // Initialize questions state
  const initialQuestions = questionItems.map((q, index) => {
    // Initialize userAnswers array based on algorithm
    const userAnswers = Array(answerCount).fill("");

    // For the first question, prefill with correct answers as example
    if (index === 0) {
      q.correctAnswers.forEach((answer, idx) => {
        if (idx < answerCount) {
          userAnswers[idx] = answer;
        }
      });
    }

    return {
      ...q,
      userAnswers,
      completed: index === 0, // Mark first question as completed
    };
  });

  const [questionsState, setQuestionsState] = useState(initialQuestions);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);

  const { playSound } = useSoundEffects();

  // Handle input change
  const handleInputChange = (
    questionId: number | string,
    answerIndex: number,
    value: string,
  ) => {
    setQuestionsState((prevState) =>
      prevState.map((q) =>
        q.id === questionId
          ? {
              ...q,
              userAnswers: q.userAnswers.map((ans, idx) =>
                idx === answerIndex ? value : ans,
              ),
            }
          : q,
      ),
    );
  };

  // Check if a question is completely correct
  const isQuestionCorrect = (question: any) => {
    return question.correctAnswers.every(
      (correctAnswer: string, idx: number) => {
        if (idx >= answerCount) return true;
        return (
          question.userAnswers[idx].toLowerCase().trim() ===
          correctAnswer.toLowerCase()
        );
      },
    );
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    let correctQuestions = 0;

    questionsState.forEach((q, index) => {
      // Skip the first question (index 0) when calculating score
      if (index === 0) return;

      if (isQuestionCorrect(q)) {
        correctQuestions++;
      }
    });

    setScore(correctQuestions);
    playSound("success");
    setResultsDialogOpen(true);
  };

  // Reset the activity
  const resetActivity = () => {
    setQuestionsState(
      initialQuestions.map((q, index) => {
        if (index === 0) {
          return { ...q }; // Keep the first question as is (already completed)
        } else {
          return {
            ...q,
            userAnswers: Array(answerCount).fill(""),
            completed: false,
          };
        }
      }),
    );
    setShowResults(false);
    setScore(0);
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      <div
        className="flex flex-col gap-2 h-full"
        style={{
          fontSize: questions.fontSize ? `${questions.fontSize}px` : "20px",
        }}
      >
        {/* Render the first question as column titles */}
        {questionsState.length > 0 && (
          <div
            className={cn(
              "p-4 rounded flex flex-col justify-between md:flex-row items-center gap-2 px-6",
              "bg-lemon-100 text-lemon-700",
            )}
          >
            {/* <span className="font-bold min-w-8">{1}.</span> */}
            <div className="font-semibold mr-4">
              {questionsState[0].question}
            </div>
            {questionsState[0].correctAnswers
              .slice(0, answerCount)
              .map((title, idx) => (
                <div
                  key={idx}
                  className="flex-1 max-w-56 mt-2 md:mt-0 text-center font-semibold"
                >
                  {title}
                </div>
              ))}
          </div>
        )}

        {/* Render the rest of the questions with inputs under the respective columns */}
        {questionsState.slice(1).map((q, questionIndex) => (
          <div
            key={q.id}
            className={cn(
              "p-2 rounded relative",
              showResults
                ? isQuestionCorrect(q)
                  ? "bg-green-100"
                  : "bg-red-100"
                : "bg-picton-blue-50",
            )}
          >
            {showResults && (
              <div className="absolute right-2">
                {isQuestionCorrect(q) ? (
                  <Check className="text-green-500" size={24} />
                ) : (
                  <X className="text-red-500" size={24} />
                )}
              </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 px-6">
              <div className="flex items-center gap-2">
                <span className="font-bold min-w-8">{questionIndex + 1}.</span>
                <div className="mr-4">{q.question}</div>
              </div>

              {q.userAnswers.map((answer, idx) => (
                <div key={idx} className="flex-1 max-w-56 mt-2 md:mt-0">
                  <Input
                    type="text"
                    value={answer}
                    onChange={(e) =>
                      handleInputChange(q.id, idx, e.target.value)
                    }
                    className="p-2 bg-transparent text-center border-none rounded"
                    disabled={showResults}
                  />
                  <div
                    className={cn(
                      "border-b border-dashed border-picton-blue-700",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showResults && (
        <div className="mt-4">
          <ActivityResults
            score={score}
            total={questionsState.length - 1}
            onRestart={resetActivity}
          />
        </div>
      )}

      {!showResults && (
        <div className="mt-8 flex justify-end">
          <Button
            onClick={checkAnswers}
            variant="brand-lemon"
            style={{
              opacity: questionsState
                .slice(1)
                .every((q) =>
                  q.userAnswers.every((answer) => answer.trim() !== ""),
                )
                ? 1
                : 0,
              transition: "opacity 0.3s ease",
            }}
            disabled={
              !questionsState
                .slice(1)
                .every((q) =>
                  q.userAnswers.every((answer) => answer.trim() !== ""),
                )
            }
          >
            Check Answers
          </Button>
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={questionsState.length - 1}
        open={resultsDialogOpen}
        onOpenChange={(open) => {
          setResultsDialogOpen(open);
          if (!open) {
            if (feedback === "none") {
              resetActivity();
            } else {
              setShowResults(true);
            }
          }
        }}
      />
    </div>
  );
};

export default CompleteSentencesWithThreeClauses;
