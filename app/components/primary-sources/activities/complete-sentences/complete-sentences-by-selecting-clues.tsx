import { useEffect, useState } from "react";

// Local imports
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/ui/inputs/custom-input";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { shuffle } from "@/lib/utils";

type TCompleteSentencesBySelectingCluesProps = {
  questions: {
    title: string;
    options: string[];
    questions: {
      id: number | string;
      question: string;
      correctAnswer: string;
    }[];
  };
  feedback?: FeedbackType;
};

type TQuestionState = {
  id: number | string;
  question: string;
  correctAnswer: string;
  displayText: string;
  highlightedWord: string;
  userAnswer: string;
  isCorrect?: boolean;
};

const CompleteSentencesBySelectingCluesActivity = ({
  questions,
  feedback,
}: TCompleteSentencesBySelectingCluesProps) => {
  const { title, options, questions: questionItems } = questions;
  const { playSound } = useSoundEffects();

  // Process questions to extract highlighted words and format display text
  const processedQuestions: TQuestionState[] = questionItems.map((q) => {
    const questionText = q.question;
    // Find the word marked with underscore
    const underscoreIndex = questionText.indexOf("_");

    if (underscoreIndex !== -1) {
      // Extract the highlighted word (without the underscore)
      const highlightedWord = questionText
        .substring(underscoreIndex + 1)
        .split(" ")[0];

      // Create the display text with the word highlighted (but without underscore)
      const displayText = questionText
        .replace("_" + highlightedWord, highlightedWord)
        .replace(/_/g, ""); // Remove any remaining underscores

      return {
        ...q,
        displayText,
        highlightedWord,
        userAnswer: "",
      };
    }

    // Fallback if no underscore found
    return {
      ...q,
      displayText: questionText,
      highlightedWord: "",
      userAnswer: "",
    };
  });

  const [questionsState, setQuestionsState] =
    useState<TQuestionState[]>(processedQuestions);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if all questions have been answered
  useEffect(() => {
    const answered = questionsState.every((q) => q.userAnswer.trim() !== "");
    setAllAnswered(answered);
  }, [questionsState]);

  // Handle input change
  const handleInputChange = (questionId: number | string, value: string) => {
    setQuestionsState((prevState) =>
      prevState.map((q) =>
        q.id === questionId ? { ...q, userAnswer: value } : q
      )
    );
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    let correctCount = 0;

    const updatedQuestions = questionsState.map((q) => {
      const isCorrect =
        q.userAnswer.trim().toLowerCase() === q.correctAnswer.toLowerCase();
      if (isCorrect) correctCount++;
      return { ...q, isCorrect };
    });

    setQuestionsState(updatedQuestions);
    setScore(correctCount);
    playSound("success");
    setAllAnswered(true);
    setIsDialogOpen(true);
  };

  // Reset the activity
  const resetActivity = () => {
    setQuestionsState(
      shuffle(
        processedQuestions.map((q) => ({
          ...q,
          userAnswer: "",
          isCorrect: undefined,
        }))
      )
    );
    setShowResults(false);
    setScore(0);
  };

  // Handle word selection from word bank
  const handleWordSelection = (word: string, questionId: number | string) => {
    if (showResults) return;

    setQuestionsState((prevState) =>
      prevState.map((q) =>
        q.id === questionId ? { ...q, userAnswer: word } : q
      )
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={title} />

      <div className="space-y-4">
        {questionsState.map((q, index) => {
          // Generate the display text with highlighted word
          const parts = q.displayText.split(q.highlightedWord);
          const before = parts[0];
          const after = parts.slice(1).join(q.highlightedWord);

          return (
            <div key={q.id} className="p-4 bg-white rounded-md shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-red-500 min-w-8">
                  {index + 1}.
                </span>
                <div className="font-medium">
                  {before}
                  <span className="bg-picton-blue-200 px-2 py-1 rounded">
                    {q.highlightedWord}
                  </span>
                  {after}
                </div>

                <CustomInput
                  value={q.userAnswer}
                  onChange={(value) => handleInputChange(q.id, value)}
                  placeholder="Type answer here"
                  disabled={showResults}
                  className="flex-1 min-w-32 ml-4"
                  isCorrect={showResults ? q.isCorrect : undefined}
                  correctAnswer={
                    feedback === "wrong-correct-answers"
                      ? q.correctAnswer
                      : undefined
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      {showResults ? (
        <ActivityResults
          score={score}
          total={questionsState.length}
          onRestart={resetActivity}
        />
      ) : (
        <>
          {/* Word Bank */}
          <div className="flex flex-wrap mt-8 gap-6">
            {options.map((word, i) => (
              <div key={i}>{word}</div>
            ))}
          </div>
          <div className="flex mt-4 justify-end">
            <Button onClick={checkAnswers} disabled={!allAnswered}>
              Check Answers
            </Button>
          </div>
        </>
      )}

      <ActivityResultsAlertDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (feedback === "none") {
              resetActivity();
            } else {
              setShowResults(true);
            }
            setIsDialogOpen(false);
          }
        }}
        score={score}
        total={questionsState.length}
      />
    </div>
  );
};

export default CompleteSentencesBySelectingCluesActivity;
