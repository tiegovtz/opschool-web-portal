import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { DragEndEvent, useDroppable } from "@dnd-kit/core";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import Draggable from "@/components/ui/dnd/draggable";
import DNDContext from "@/components/layout/dnd-context";
import { DroppableProps } from "@/components/ui/dnd/droppable";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { FeedbackType } from "@/lib/types/activity-types";

type Question = {
  id: string;
  question: string[];
  answer: string[];
};

type TCompleteSentenceRearrangeDraggingActivityProps = {
  feedback: FeedbackType;
  questions: {
    title: string;
    questions: Question[];
  };
};

const Droppable = ({ id, data, children, ...props }: DroppableProps) => {
  const { isOver, setNodeRef, over, active } = useDroppable({
    id,
    data,
  });

  const isCorrect =
    over?.data?.current?.accepts === active?.data?.current?.type;

  return (
    <div
      {...props}
      ref={setNodeRef}
      className={cn(props.className, { "bg-lemon-100": isOver && isCorrect })}
      id={id}
    >
      {children}
    </div>
  );
};

const CompleteSentenceRearrangeDraggingActivity = ({
  feedback,
  questions: questionsData,
}: TCompleteSentenceRearrangeDraggingActivityProps) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<
    {
      id: string;
      question: string[];
      answer: string[];
    }[]
  >(
    questionsData.questions.map((q) => {
      return {
        id: q.id,
        question: q.question.map((w) => w),
        answer: Array(q.answer.length).fill(""),
      };
    }),
  );

  const { playSound } = useSoundEffects();

  useEffect(() => {
    const answered = questions.every((q) => q.answer.every((a) => a));
    if (answered) {
      setAllAnswered(true);
      playSound("success");
      const correctAnswers = questionsData.questions.map((q) => q.answer);
      const score = questions.reduce((acc, question, idx) => {
        const isCorrect =
          question.answer.length === correctAnswers[idx].length &&
          question.answer.every((a, i) => a === correctAnswers[idx][i]);
        return acc + (isCorrect ? 1 : 0);
      }, 0);
      setScore(score);
    }
  }, [questions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over?.data?.current?.accepts === active?.data?.current?.type) {
      const index = String(over?.id).split("%")[1];
      const word = String(active.id).split("%")[1];

      const newAnswers = questions
        .find((q) => q.id === over?.data?.current?.accepts)
        ?.answer.map((a, i) => {
          if (i === parseInt(index)) {
            return word;
          }

          if (a === word) {
            return "";
          }
          return a;
        });

      const newQuestions = questions.map((q) => {
        if (q.id === over?.data?.current?.accepts) {
          return {
            ...q,
            question: q.question.map((w) => {
              if (w === word) {
                return "";
              }
              return w;
            }),
            answer: newAnswers as string[],
          };
        }
        return q;
      });

      setQuestions(newQuestions);
    }
  };

  const resetActivity = () => {
    setAllAnswered(false);
    setScore(0);
    setQuestions(
      questionsData.questions.map((q) => {
        return {
          id: q.id,
          question: shuffle(q.question.map((w) => w)),
          answer: Array(q.answer.length).fill(""),
        };
      }),
    );
    setShowResults(false);
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questionsData.title} />

      <div className="flex-1 flex flex-col gap-10">
        <DNDContext onDragEnd={showResults ? () => {} : handleDragEnd}>
          {questions.map((question, i) => {
            const correctAnswer = questionsData.questions.find(
              (sq) => sq.id === question.id,
            )?.answer;
            const isCorrect =
              showResults &&
              correctAnswer &&
              question.answer.length === correctAnswer.length &&
              question.answer.every((a, i) => a === correctAnswer[i]);

            return (
              <div
                key={question.id}
                className={cn(
                  "flex items-center gap-4 p-4 relative rounded-lg transition-all duration-300",
                  showResults
                    ? isCorrect
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                    : "bg-white",
                )}
              >
                <p>{i + 1}.</p>

                <div className="flex-1 flex flex-col gap-4">
                  {
                    // if the question has no words, don't show it
                    question.question.length > 0 &&
                      question.question.some((word) => word) && (
                        <div className="flex items-center gap-2 xl:gap-6">
                          <div className="flex gap-2 xl:gap-6 flex-1">
                            {question.question.map((word, index) => {
                              if (!word)
                                return (
                                  <div
                                    key={index}
                                    className="min-h-12 flex-1 p-2"
                                  />
                                );

                              return (
                                <Draggable
                                  key={index}
                                  id={question.id + "%" + word + "%" + index}
                                  data={{
                                    type: question.id,
                                  }}
                                  className={cn(
                                    "p-2 min-h-12 flex-1 flex items-center rounded-lg justify-center text-lg",
                                    showResults
                                      ? "bg-gray-200 cursor-not-allowed"
                                      : "bg-picton-blue-200",
                                  )}
                                  disabled={showResults}
                                >
                                  {word}
                                </Draggable>
                              );
                            })}
                          </div>
                        </div>
                      )
                  }
                  <div className="flex gap-2 xl:gap-6">
                    {question.answer.map((_word, index) => {
                      if (_word) {
                        return (
                          <Draggable
                            key={index}
                            id={question.id + "%" + _word + "%" + index}
                            data={{
                              type: question.id,
                            }}
                            className={cn(
                              "p-2 flex-1 flex items-center justify-center rounded-lg text-lg",
                              showResults
                                ? isCorrect
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                : "bg-lemon-100 text-lemon-700",
                            )}
                            disabled={showResults}
                          >
                            {_word}
                          </Draggable>
                        );
                      }

                      return (
                        <Droppable
                          key={index}
                          id={question.id + "%" + index}
                          data={{
                            accepts: question.id,
                          }}
                          className={cn(
                            "border-b min-h-12 border-dashed rounded-lg flex-1 px-2 py-6",
                            showResults ? "bg-gray-100" : "bg-picton-blue-100",
                          )}
                        >
                          {question.answer[index]}
                        </Droppable>
                      );
                    })}
                  </div>

                  {showResults &&
                    !isCorrect &&
                    correctAnswer &&
                    feedback === "wrong-correct-answers" && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-2">
                          Correct answer:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {correctAnswer.map((word, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-md bg-green-100 text-green-700 text-sm"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {showResults && (
                  <div
                    className={cn(
                      "absolute -right-2 -top-2 flex items-center justify-center rounded-full p-1 w-8 h-8",
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
              </div>
            );
          })}
        </DNDContext>

        {showResults && (
          <ActivityResults
            score={score}
            total={questions.length}
            onRestart={resetActivity}
          />
        )}
      </div>

      <ActivityResultsAlertDialog
        score={score}
        total={questions.length}
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

export default CompleteSentenceRearrangeDraggingActivity;
