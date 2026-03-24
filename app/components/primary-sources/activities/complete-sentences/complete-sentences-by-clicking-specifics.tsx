import { useState } from "react";
import { Check, X } from "lucide-react";

// local imports
import { shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { FeedbackType } from "@/lib/types/activity-types";

type TCompleteSentencesByClickingSpecifics = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    fontSize?: string;
    questions: {
      id: string;
      question: string;
      answers: string[];
    }[];
  };
};

type ShuffledQuestion = {
  id: string;
  question: string;
  answers: string[];
};

const CompleteSentencesByClickingSpecificsActivity = ({
  feedback,
  questions,
}: TCompleteSentencesByClickingSpecifics) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedWords, setSelectedWords] = useState<{
    [key: string]: string[];
  }>({});
  const [shuffledQuestions, setShuffledQuestions] = useState<
    ShuffledQuestion[]
  >([...questions.questions]);

  const { playSound } = useSoundEffects();

  // Function to clean words by removing punctuation
  const cleanWord = (word: string): string => {
    return word
      .replace(/[.,!?;:()[\]{}""''`]/g, "")
      .toLowerCase()
      .trim();
  };

  const handleWordClick = (questionId: string, word: string) => {
    // Clean the word before processing
    const cleanedWord = word;

    setSelectedWords((prev) => {
      const currentSelected = prev[questionId] || [];
      if (currentSelected.includes(cleanedWord)) {
        return {
          ...prev,
          [questionId]: currentSelected.filter((w) => w !== cleanedWord),
        };
      } else {
        return {
          ...prev,
          [questionId]: [...currentSelected, cleanedWord],
        };
      }
    });
  };

  const checkAnswers = () => {
    let correctCount = 0;

    shuffledQuestions.forEach((question) => {
      const selected = selectedWords[question.id] || [];
      const correctAnswers = question.answers.map(cleanWord);

      // Clean selected words for comparison
      const cleanedSelected = selected.map(cleanWord);

      // Check if all required words are selected (nothing more, nothing less)
      const allRequiredWordsSelected =
        correctAnswers.length === cleanedSelected.length &&
        correctAnswers.every((answer) =>
          cleanedSelected.some((selected) => selected === answer),
        );

      if (allRequiredWordsSelected) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setAllAnswered(true);
    playSound("success");
  };

  const handleTryAgain = () => {
    setAllAnswered(false);
    setShowResults(false);
    setScore(0);
    setSelectedWords({});
    setShuffledQuestions(shuffle([...questions.questions]));
  };

  const renderWords = (questionId: string, question: string) => {
    const words = question.split(" ");
    const correctAnswers =
      shuffledQuestions.find((q) => q.id === questionId)?.answers || [];

    // Clean correct answers for comparison
    const cleanedCorrectAnswers = correctAnswers.map(cleanWord);

    // Check if all correct answers are selected for this question
    const selectedForQuestion = selectedWords[questionId] || [];
    const cleanedSelected = selectedForQuestion.map(cleanWord);
    const allCorrectSelected =
      cleanedCorrectAnswers.every((answer) =>
        cleanedSelected.some((selected) => selected === answer),
      ) && cleanedCorrectAnswers.length === cleanedSelected.length;

    return words.map((word, index) => {
      const isSelected = selectedWords[questionId]?.includes(word);
      // Clean the word for comparison
      const cleanedWord = cleanWord(word);
      const isCorrect = cleanedCorrectAnswers.includes(cleanedWord);

      let className = "cursor-pointer mx-1 ";

      if (!showResults) {
        className += isSelected
          ? "bg-lemon-100 text-lemon-700 rounded px-1 border border-lemon-700"
          : "hover:bg-picton-blue-100 rounded px-1";
      } else {
        if (isSelected && isCorrect) {
          // Green if all correct answers are selected, amber if only partial
          className += allCorrectSelected
            ? "bg-green-100 text-green-700 rounded px-1 border border-green-700"
            : "bg-amber-100 text-amber-700 rounded px-1 border border-amber-700";
        } else if (isSelected && !isCorrect) {
          className +=
            "bg-red-100 text-red-700 rounded px-1 border border-red-700";
        } else if (
          !isSelected &&
          isCorrect &&
          feedback === "wrong-correct-answers"
        ) {
          className += "bg-amber-100 text-amber-700 rounded px-1";
        } else {
          className += "rounded px-1";
        }
      }

      return (
        <span
          key={index}
          onClick={() => !showResults && handleWordClick(questionId, word)}
          className={className}
        >
          {word}
          {showResults && isSelected && (
            <span className="ml-1 inline-flex">
              {isCorrect ? (
                <Check
                  className={
                    allCorrectSelected ? "text-green-600" : "text-amber-600"
                  }
                  size={16}
                />
              ) : (
                <X className="text-red-600" size={16} />
              )}
            </span>
          )}
          {showResults &&
            !isSelected &&
            isCorrect &&
            feedback === "wrong-correct-answers" && (
              <span className="ml-1 inline-flex">
                <Check className="text-amber-600" size={16} />
              </span>
            )}
        </span>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />
      <div
        className="flex flex-col gap-2"
        style={{
          fontSize: questions.fontSize ? `${questions.fontSize}px` : "20px",
        }}
      >
        {shuffledQuestions.map((question, i) => (
          <div key={question.id} className="p-4 bg-picton-blue-50 rounded-md">
            <p>
              {i + 1}. {renderWords(question.id, question.question)}
            </p>
          </div>
        ))}
      </div>

      {!showResults && (
        <div className="mt-4 flex justify-end">
          <Button variant="brand-lemon" onClick={checkAnswers}>
            Check Answers
          </Button>
        </div>
      )}

      {showResults && (
        <ActivityResults
          score={score}
          total={questions.questions.length}
          onRestart={handleTryAgain}
        />
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={questions.questions.length}
        open={allAnswered}
        onOpenChange={(open) => {
          setAllAnswered(open);
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </div>
  );
};

export default CompleteSentencesByClickingSpecificsActivity;
