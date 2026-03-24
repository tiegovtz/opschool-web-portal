import { useState } from "react";
import { Check, X } from "lucide-react";

// Local imports
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useWindowSize } from "@/shared/hooks/use-window-size";

type TCompleteSentencesBySelectingCorrectOnesActivity = {
  questions: {
    title: string;
    fontSize?: string;
    questions: {
      question: string[];
      answer: number;
    }[];
  };
};

const CompleteSentencesBySelectingCorrectOnesActivity = ({
  questions,
}: TCompleteSentencesBySelectingCorrectOnesActivity) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);

  const { playSound } = useSoundEffects();
  const { width } = useWindowSize();

  const handleCheck = (questionIndex: number, answerIndex: number) => {
    // Update answers with the new selection
    const newAnswers = {
      ...answers,
      [questionIndex]: answerIndex,
    };
    setAnswers(newAnswers);

    // Check if all questions have been answered
    if (Object.keys(newAnswers).length === questions.questions.length) {
      setAllAnswered(true);
    }
  };

  const checkAnswers = () => {
    let correctCount = 0;

    Object.keys(answers).forEach((questionIndex) => {
      const questionIdx = parseInt(questionIndex);
      const correctAnswer = questions.questions[questionIdx].answer;
      if (answers[questionIdx] === correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    playSound("success");
    setResultsDialogOpen(true);
  };

  const resetActivity = () => {
    setAllAnswered(false);
    setShowResults(false);
    setScore(0);
    setAnswers({});
    setResultsDialogOpen(false);
  };

  const isQuestionCorrect = (questionIndex: number) => {
    const userAnswer = answers[questionIndex];
    const correctAnswer = questions.questions[questionIndex].answer;
    return userAnswer === correctAnswer;
  };

  const getQuestionContainerColor = (questionIndex: number) => {
    if (!showResults) {
      // If question is answered but results not shown yet, use lemon color
      return answers[questionIndex] !== undefined
        ? "bg-lemon-100"
        : "bg-picton-blue-50";
    }

    // Show results - green for correct, red for incorrect
    return isQuestionCorrect(questionIndex) ? "bg-green-100" : "bg-red-100";
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />
      <div
        className="flex flex-col h-full gap-4 sm:p-4 overflow-auto"
        style={{
          fontSize:
            width <= 640
              ? "16px"
              : questions.fontSize
                ? `${questions.fontSize}px`
                : "20px",
        }}
      >
        {questions.questions.map((q, questionIndex) => (
          <div
            key={questionIndex}
            className={cn(
              "rounded-lg p-4 transition-colors duration-300",
              getQuestionContainerColor(questionIndex),
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-lg">{questionIndex + 1}.</span>
              {showResults && (
                <div className="flex-shrink-0">
                  {isQuestionCorrect(questionIndex) ? (
                    <Check className="text-green-600 w-6 h-6" />
                  ) : (
                    <X className="text-red-600 w-6 h-6" />
                  )}
                </div>
              )}
            </div>

            {q.question.map((sentence, sentenceIndex) => (
              <div
                key={sentenceIndex}
                className="flex items-center justify-between gap-4 py-2"
              >
                <p
                  className={cn("flex-1", {
                    "text-picton-blue-700": !showResults,
                    "text-green-700":
                      showResults && isQuestionCorrect(questionIndex),
                    "text-red-700":
                      showResults && !isQuestionCorrect(questionIndex),
                  })}
                >
                  {sentence}
                </p>

                <Checkbox
                  id={`${questionIndex}-${sentenceIndex}`}
                  checked={answers[questionIndex] === sentenceIndex}
                  onCheckedChange={() =>
                    handleCheck(questionIndex, sentenceIndex)
                  }
                  disabled={showResults}
                  className={cn("w-6 h-6", {
                    "data-[state=checked]:bg-lemon-600 data-[state=checked]:border-lemon-300":
                      !showResults && answers[questionIndex] === sentenceIndex,
                    "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-300":
                      showResults &&
                      answers[questionIndex] === sentenceIndex &&
                      isQuestionCorrect(questionIndex),
                    "data-[state=checked]:bg-red-600 data-[state=checked]:border-red-300":
                      showResults &&
                      answers[questionIndex] === sentenceIndex &&
                      !isQuestionCorrect(questionIndex),
                  })}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {!showResults && allAnswered && (
        <div className="p-4 flex justify-end">
          <Button onClick={checkAnswers} variant="brand-lemon">
            Check Answers
          </Button>
        </div>
      )}

      {showResults && (
        <div className="p-4">
          <ActivityResults
            score={score}
            total={questions.questions.length}
            onRestart={resetActivity}
          />
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={questions.questions.length}
        open={resultsDialogOpen}
        onOpenChange={(open) => {
          setResultsDialogOpen(open);
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </div>
  );
};

export default CompleteSentencesBySelectingCorrectOnesActivity;
