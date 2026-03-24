"use client";

import { Check, X } from "lucide-react";
import { DragEndEvent } from "@dnd-kit/core";
import { Fragment, useEffect, useState } from "react";

// local imports
import { shuffle } from "@/lib/utils";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import DNDContext from "@/components/layout/dnd-context";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TCompleteParagraphWithCluesJ2Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    paragraph: string;
    image: string;
    answers: string[];
    options: string[];
  };
};

const CompleteParagraphWithCluesJunior = ({
  feedback,
  questions,
}: TCompleteParagraphWithCluesJ2Props) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>(
    Array.from({ length: questions.answers.length })
  );
  const [remainingOptions, setRemainingOptions] = useState<string[]>(
    questions.options
  );

  const { playSound } = useSoundEffects();

  useEffect(() => {
    if (userAnswers.every((answer) => answer)) {
      const newScore = userAnswers.reduce(
        (acc, answer, i) => (answer === questions.answers[i] ? acc + 1 : acc),
        0
      );
      setScore(newScore);
      setAllAnswered(true);
      playSound("success");
    }
  }, [userAnswers, questions.answers]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active.id || !over?.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeIndex = questions.answers.indexOf(activeId);
    const overIndex = Number(overId.split("%")[1]);

    if (activeIndex === -1) return;

    const newUserAnswers = [...userAnswers];

    // remove the answer from the previous position if it exists
    const prevIndex = newUserAnswers.indexOf(activeId);
    if (prevIndex !== -1) newUserAnswers[prevIndex] = "";
    newUserAnswers[overIndex] = activeId;

    setUserAnswers(newUserAnswers);
    playSound("click");
    setRemainingOptions((prev) => prev.filter((option) => option !== activeId));
  };

  const resetActivity = () => {
    setAllAnswered(false);
    setShowingFeedback(false);
    setScore(0);
    setUserAnswers(Array.from({ length: questions.answers.length }));
    setRemainingOptions(shuffle(questions.options));
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={questions.title} />

      <DNDContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4 h-full">
          <div className="flex flex-col md:flex-row gap-4 h-full">
            <div className="bg-picton-blue-50 flex flex-col overflow-auto h-full justify-between w-full rounded-xl p-4">
              <div className="md:p-4 text-lg leading-loose">
                {/* separate the paragraph by "___" then add an empty block */}
                {questions.paragraph.split("___").map((part, i) => (
                  <Fragment key={i}>
                    {part}
                    {showingFeedback &&
                    i !== questions.paragraph.split("___").length - 1 ? (
                      <span className="inline-block relative w-36 h-8 mx-2 align-middle">
                        <span
                          className={`inline-flex items-center justify-between w-full h-full text-center px-2 ${
                            userAnswers[i] === questions.answers[i]
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          <span className="truncate">
                            {userAnswers[i] !== "" ? userAnswers[i] : "-"}
                          </span>
                          {userAnswers[i] === questions.answers[i] ? (
                            <Check className="h-5 w-5 text-green-600 shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-red-600 shrink-0" />
                          )}
                        </span>
                        {feedback === "wrong-correct-answers" &&
                          userAnswers[i] !== questions.answers[i] && (
                            <span className="absolute -bottom-5 left-0 z-10 text-sm font-medium text-green-700 bg-green-100 px-1 rounded">
                              {questions.answers[i]}
                            </span>
                          )}
                      </span>
                    ) : userAnswers[i] ? (
                      <Draggable
                        id={userAnswers[i]}
                        className="inline-block w-36 h-8 text-center bg-lemon-200 text-lemon-700 mx-2 align-middle"
                      >
                        <span>{userAnswers[i]}</span>
                      </Draggable>
                    ) : (
                      i !== questions.paragraph.split("___").length - 1 && (
                        <Droppable
                          id={`blank%${i}`}
                          isOverClassName="bg-lemon-200"
                          className="inline-block w-36 h-8 bg-picton-blue-100 mx-2 align-middle"
                        />
                      )
                    )}
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="bg-white md:w-1/2 flex items-center justify-center rounded-xl text-lg p-4">
              {questions.image && (
                <img
                  src={questions.image}
                  alt="complete paragraph with clues"
                  className="object-contain w-full max-h-[600px]"
                />
              )}
            </div>
          </div>
          {showingFeedback ? (
            <ActivityResults
              score={score}
              total={questions.answers.length}
              onRestart={resetActivity}
            />
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Options</h3>
              <div className="flex gap-2 text-lg flex-wrap">
                {remainingOptions.map((answer, i) => (
                  <Draggable
                    key={i}
                    id={answer}
                    className="flex justify-center gap-4 rounded min-w-36 px-4 h-10 items-center text-picton-blue-700 bg-picton-blue-200"
                  >
                    <span>{answer}</span>
                  </Draggable>
                ))}
              </div>
            </div>
          )}
        </div>
      </DNDContext>

      <ActivityResultsAlertDialog
        open={allAnswered}
        score={score}
        total={questions.answers.length}
        onOpenChange={() => {
          setAllAnswered(false);
          setShowingFeedback(true);
        }}
      />
    </div>
  );
};

export default CompleteParagraphWithCluesJunior;
