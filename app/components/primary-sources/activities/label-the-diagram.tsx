import { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Local imports
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TLabelTheDiagramProps = {
  notes: string;
  title: string;
  image: string;
  variant?: "input" | "checkbox";
  questions: {
    question: string;
    title?: string;
    answers: string[];
  }[];
};

const answerChecker = new AnswerChecker();

const LabelTheDiagram = ({
  questions,
  feedback,
}: {
  questions: TLabelTheDiagramProps;
  feedback?: FeedbackType;
}) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [answersChecked, setAnswersChecked] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);
  const [theTypedAnswers, setTheTypedAnswers] = useState<string[]>([]);
  const [checkboxAnswers, setCheckboxAnswers] = useState<boolean[]>([]);
  const [duplicateCleared, setDuplicateCleared] = useState<number | null>(null);

  const isCheckboxVariant = questions.variant === "checkbox";

  const { playSound } = useSoundEffects();

  const resetActivity = () => {
    setTheTypedAnswers(Array(questions.questions.length).fill(""));
    setCheckboxAnswers(Array(questions.questions.length).fill(false));
    setScore(0);
    setAllAnswered(false);
    setCorrectAnswers([]);
    setAnswersChecked(false);
    setDuplicateCleared(null);
  };

  const handleCheckAnswer = () => {
    // First, clear any duplicates that might exist
    // const cleanedAnswers = clearDuplicatesInGroups();

    // Check each answer using the cleaned answers
    const newCorrectAnswers = questions.questions.map((question, index) => {
      if (isCheckboxVariant) {
        // For checkbox variant, check if the checkbox state matches the correct answer
        const correctAnswer = question.answers[0].toUpperCase() === "T";
        return !!checkboxAnswers[index] === correctAnswer;
      } else {
        const result = answerChecker.checkAnswer(theTypedAnswers[index] || "", {
          strictMode: true,
          acceptedAnswers: question.answers,
        });
        return result.isCorrect;
      }
    });

    // Calculate score
    const newScore = newCorrectAnswers.filter(Boolean).length;

    // Update state
    setCorrectAnswers(newCorrectAnswers);
    setScore(newScore);
    setAnswersChecked(true);
    setAllAnswered(true);

    playSound("success");
  };

  // Helper function to get used answers for a specific group (by title)
  // const getUsedAnswersForGroup = (
  //   groupTitle: string | null,
  //   excludeIndex?: number,
  // ) => {
  //   const usedAnswers: string[] = [];
  //   const groups = groupQuestionsByTitle();

  //   const targetGroup = groups.find((g) => g.title === groupTitle);
  //   if (!targetGroup) return usedAnswers;

  //   targetGroup.questions.forEach(({ originalIndex }) => {
  //     if (excludeIndex !== undefined && originalIndex === excludeIndex) return;
  //     const answer = theTypedAnswers[originalIndex];
  //     if (answer && answer.trim()) {
  //       usedAnswers.push(answer.trim().toLowerCase());
  //     }
  //   });

  //   return usedAnswers;
  // };

  // Helper function to clear duplicates within each group before checking answers
  // const clearDuplicatesInGroups = () => {
  //   const groups = groupQuestionsByTitle();
  //   const newTypedAnswers = [...theTypedAnswers];

  //   groups.forEach((group) => {
  //     const usedInGroup: string[] = [];

  //     group.questions.forEach(({ originalIndex }) => {
  //       const answer = newTypedAnswers[originalIndex];
  //       if (answer && answer.trim()) {
  //         const normalizedAnswer = answer.trim().toLowerCase();
  //         if (usedInGroup.includes(normalizedAnswer)) {
  //           // Clear this duplicate
  //           newTypedAnswers[originalIndex] = "";
  //         } else {
  //           usedInGroup.push(normalizedAnswer);
  //         }
  //       }
  //     });
  //   });

  //   setTheTypedAnswers(newTypedAnswers);
  //   return newTypedAnswers;
  // };

  // // Helper function to handle input blur (when user moves focus away)
  // const handleInputBlur = useCallback(
  //   (index: number, groupTitle: string | null) => {
  //     const currentAnswer = theTypedAnswers[index];
  //     if (!currentAnswer || !currentAnswer.trim()) return;

  //     const normalizedCurrent = currentAnswer.trim().toLowerCase();
  //     const usedAnswers = getUsedAnswersForGroup(groupTitle, index);

  //     if (usedAnswers.includes(normalizedCurrent)) {
  //       // Clear this duplicate
  //       setTheTypedAnswers((prev) => {
  //         const newAnswers = [...prev];
  //         newAnswers[index] = "";
  //         return newAnswers;
  //       });

  //       // Show feedback that duplicate was cleared
  //       setDuplicateCleared(index);
  //       setTimeout(() => setDuplicateCleared(null), 3000);
  //     }
  //   },
  //   [theTypedAnswers],
  // );

  // Helper function to check if all required inputs are filled
  const areAllRequiredInputsFilled = () => {
    if (isCheckboxVariant) {
      // For checkbox variant, all questions are always "filled" (can be checked or unchecked)
      return true;
    }
    return questions.questions.every(
      (question, index) =>
        !question.question.includes("___") || theTypedAnswers[index],
    );
  };

  // Helper function to group questions by title
  const groupQuestionsByTitle = () => {
    const grouped: {
      title: string | null;
      questions: { question: any; originalIndex: number }[];
    }[] = [];

    questions.questions.forEach((question, index) => {
      const title = question.title || null;
      let group = grouped.find((g) => g.title === title);

      if (!group) {
        group = { title, questions: [] };
        grouped.push(group);
      }

      group.questions.push({ question, originalIndex: index });
    });

    return grouped;
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      <div className="flex flex-col gap-4 h-full">
        <div className="grid md:grid-cols-2 gap-4 h-full">
          <div className="bg-white flex flex-col justify-between gap-4 w-full md:h-[calc(100dvh-200px)] overflow-y-auto rounded-xl p-2 md:p-6">
            <div
              className={cn({
                "md:overflow-auto md:max-h-[300px]": questions.image,
              })}
            >
              <p
                className="whitespace-pre-line text-lg tracking-wide text-picton-blue-700 h-full"
                dangerouslySetInnerHTML={{
                  __html: questions.notes,
                }}
              />
            </div>
            {questions.image && (
              <div className="rounded-xl p-1 h-3/4">
                <img
                  src={questions.image}
                  alt="Matching Items"
                  className="object-contain mx-auto h-full"
                />
              </div>
            )}
          </div>
          <div className="bg-white flex gap-4 justify-between w-full rounded-xl p-4 md:p-6 text-lg">
            {groupQuestionsByTitle().map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-col gap-2">
                {group.title && (
                  <h3 className="font-bold text-xl text-picton-blue-800 mb-2">
                    {group.title}
                  </h3>
                )}
                {group.questions.map(({ question, originalIndex }) => {
                  // Split question text by the "___" placeholder
                  const parts = question.question.split("___");
                  const isCorrect = correctAnswers[originalIndex];
                  const isChecked = answersChecked;

                  // Render checkbox variant
                  if (isCheckboxVariant) {
                    return (
                      <div
                        key={originalIndex}
                        className="flex items-center gap-3 py-2"
                      >
                        <Checkbox
                          checked={checkboxAnswers[originalIndex]}
                          onCheckedChange={(checked) => {
                            setCheckboxAnswers((prev) => {
                              const newAnswers = [...prev];
                              newAnswers[originalIndex] = checked === true;
                              return newAnswers;
                            });
                          }}
                          disabled={answersChecked}
                          className={cn(
                            "h-5 w-5",
                            isChecked && isCorrect && "border-green-500",
                            isChecked && !isCorrect && "border-red-500",
                          )}
                        />
                        <span className="text-picton-blue-800">
                          {question.question}
                        </span>
                        {isChecked && (
                          <>
                            {isCorrect ? (
                              <Check
                                className="text-green-500 ml-2 shrink-0"
                                size={20}
                              />
                            ) : (
                              <X className="text-red-500 ml-2" size={20} />
                            )}
                          </>
                        )}
                      </div>
                    );
                  }

                  // Render input variant (original)
                  return (
                    <div key={originalIndex} className="gap-2">
                      {parts.length > 1 ? (
                        <>
                          <span>{parts[0]}</span>
                          <span className="inline-flex items-center gap-2 mx-2 align-middle">
                            <div className="relative">
                              <Input
                                type="text"
                                className={cn(
                                  "max-w-48 rounded-none border-none bg-transparent text-picton-blue-700 text-center !text-lg",
                                  isChecked && isCorrect && "bg-green-50",
                                  isChecked && !isCorrect && "bg-red-50",
                                  duplicateCleared === originalIndex &&
                                    "bg-orange-50 border-orange-200",
                                )}
                                value={theTypedAnswers[originalIndex] || ""}
                                onChange={(e) => {
                                  setTheTypedAnswers((prev) => {
                                    const newAnswers = [...prev];
                                    newAnswers[originalIndex] = e.target.value;
                                    return newAnswers;
                                  });
                                  // Clear duplicate notification when user starts typing again
                                  if (duplicateCleared === originalIndex) {
                                    setDuplicateCleared(null);
                                  }
                                }}
                                // onBlur={() =>
                                //   handleInputBlur(originalIndex, group.title)
                                // }
                                readOnly={answersChecked}
                              />
                              <div className="border-b border-dashed border-picton-blue-700" />

                              {duplicateCleared === originalIndex && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs whitespace-nowrap flex items-center gap-1">
                                  <AlertTriangle size={12} />
                                  Duplicate Entry
                                </div>
                              )}
                            </div>

                            {isChecked && (
                              <>
                                {isCorrect ? (
                                  <Check className="text-green-500" size={20} />
                                ) : (
                                  <>
                                    <X className="text-red-500" size={20} />
                                    {feedback === "wrong-correct-answers" && (
                                      <span className="text-green-600 font-medium text-sm">
                                        {question.answers[0]}
                                      </span>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </span>
                          {parts[1]}
                        </>
                      ) : (
                        <span>{question.question}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {answersChecked ? (
          <ActivityResults
            score={score}
            total={questions.questions.length}
            onRestart={resetActivity}
          />
        ) : (
          <div className="flex items-center justify-end gap-4">
            <Button
              onClick={handleCheckAnswer}
              disabled={!areAllRequiredInputsFilled() || answersChecked}
            >
              Check Answer
            </Button>
          </div>
        )}
      </div>

      <ActivityResultsAlertDialog
        score={score}
        total={questions.questions.length}
        open={allAnswered}
        onOpenChange={(open) => {
          if (!open) {
            setAllAnswered(false);
          }
        }}
      />
    </div>
  );
};

export default LabelTheDiagram;
