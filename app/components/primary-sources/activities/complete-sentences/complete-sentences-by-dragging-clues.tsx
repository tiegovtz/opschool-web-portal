import { useState } from "react";
import { Check, X } from "lucide-react";
import { DragEndEvent } from "@dnd-kit/core";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import DNDContext from "@/components/layout/dnd-context";
import { ActivityType } from "@/lib/types/activity-types";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TCompleteSentencesByDraggingCluesActivity = {
  questions: {
    title: string;
    fontSize?: string;
    algorithm?: ActivityType;
    questions: {
      question: string;
      image?: string;
      answer: string;
    }[];
    options: {
      value: string;
      image?: string;
    }[];
  };
};

// Define a type for our option objects
type UniqueOption = {
  id: string; // Unique identifier
  value: string; // The text value of the option
  image?: string; // Optional image URL
  uniqueIndex: number; // Position in the original options array
};

const CompleteSentencesByDraggingCluesActivity = ({
  questions,
}: TCompleteSentencesByDraggingCluesActivity) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<{
    [key: string]: { value: string; optionId: string; image?: string };
  }>({});

  // Create uniquely identifiable options
  const initialOptions = questions.options.map((option, idx) => ({
    id: `option-${idx}`,
    value: option.value,
    image: option.image,
    uniqueIndex: idx,
  }));

  const [shuffledOptions, setShuffledOptions] = useState<UniqueOption[]>(
    shuffle([...initialOptions]),
  );

  const { playSound } = useSoundEffects();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeIdParts = active.id.toString().split("%");
    const dropQuestionIndex = over.id.toString().split("%")[0];

    let activeOptionUniqueId: string;
    let activeOptionValue: string;
    let activeOptionImage: string | undefined;

    // If dragging from a question (has 3 parts), get the original option info
    if (activeIdParts.length === 3) {
      const sourceQuestionIndex = activeIdParts[0];
      // Get the original option info from the answer that's currently in the source question
      const sourceAnswer = answers[sourceQuestionIndex];
      if (sourceAnswer) {
        // Get the unique option id directly
        activeOptionUniqueId = sourceAnswer.optionId;
        activeOptionValue = sourceAnswer.value;
        activeOptionImage = sourceAnswer.image;
      } else {
        // Fallback if somehow there's no answer in the source
        activeOptionUniqueId = activeIdParts[1];
        activeOptionValue = activeIdParts[2];
      }
    } else {
      // Normal drag from options pool
      activeOptionUniqueId = activeIdParts[0];
      activeOptionValue = activeIdParts[1];

      // Find the image from shuffledOptions if it exists
      const option = shuffledOptions.find(
        (opt) => opt.id === activeOptionUniqueId,
      );
      activeOptionImage = option?.image;
    }

    const newAnswers = { ...answers };

    // Check if we're dragging from an answered question
    const isDraggingFromQuestion = activeIdParts.length === 3;

    if (isDraggingFromQuestion) {
      // Get the source question index (where we're dragging from)
      const sourceQuestionIndex = activeIdParts[0];

      // If dragging to a different question, remove from source
      if (sourceQuestionIndex !== dropQuestionIndex) {
        delete newAnswers[sourceQuestionIndex];
      }
    }

    // Check if target question already has an answer
    if (newAnswers[dropQuestionIndex]) {
      // If it does, we need to remove it to prevent "used up" options
      delete newAnswers[dropQuestionIndex];
    }

    // Also check if this specific option is used in any other question
    const previousQuestionIndex = Object.entries(newAnswers).find(
      ([, answer]) => answer.optionId === activeOptionUniqueId,
    )?.[0];

    if (previousQuestionIndex) {
      delete newAnswers[previousQuestionIndex];
    }

    // Update answers with the new answer
    newAnswers[dropQuestionIndex] = {
      value: activeOptionValue,
      optionId: activeOptionUniqueId,
      image: activeOptionImage,
    };
    setAnswers(newAnswers);

    // Check if all questions are answered
    const answeredCount = Object.keys(newAnswers).length;
    setAllAnswered(answeredCount === questions.questions.length);

    playSound("click");

    // Calculate score if all questions are answered
    if (answeredCount === questions.questions.length) {
      const newScore = questions.questions.reduce((acc, question, index) => {
        return acc + (newAnswers[index]?.value === question.answer ? 1 : 0);
      }, 0);
      setScore(newScore);
      playSound("success");
    }
  };

  const getAvailableOptions = () => {
    // Get a list of all option IDs currently used in answers
    const usedOptionIds = Object.values(answers).map(
      (answer) => answer.optionId,
    );

    // Return options that are not currently placed in any question
    return shuffledOptions.filter(
      (option) => !usedOptionIds.includes(option.id),
    );
  };

  const handleTryAgain = () => {
    setAllAnswered(false);
    setShowResults(false);
    setScore(0);
    setAnswers({});
    setShuffledOptions(shuffle([...initialOptions]));
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      <div
        className="flex flex-col h-full bg-picton-blue-100 gap-2"
        style={{
          fontSize: questions.fontSize ? `${questions.fontSize}px` : "20px",
        }}
      >
        <DNDContext onDragEnd={handleDragEnd}>
          <div className="flex flex-wrap gap-1 md:gap-4 mb-4 shrink-0">
            {!showResults &&
              getAvailableOptions().map((option) => (
                <Draggable
                  key={option.id}
                  id={option.id + "%" + option.value}
                  data={{
                    type: option.uniqueIndex,
                  }}
                  className={cn(
                    "rounded flex min-w-32 border border-picton-blue-400 overflow-hidden items-center justify-center bg-none",
                    {
                      "h-12 p-2 bg-picton-blue-200":
                        questions.algorithm !==
                        ActivityType.CompleteSentencesByDraggingCluesPics,
                      "h-20":
                        questions.algorithm ===
                        ActivityType.CompleteSentencesByDraggingCluesPics,
                    },
                  )}
                >
                  {option.image &&
                  questions.algorithm ===
                    ActivityType.CompleteSentencesByDraggingCluesPics ? (
                    <img
                      src={option.image}
                      alt={option.value}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    option.value
                  )}
                </Draggable>
              ))}
          </div>

          {/* Questions container with scroll */}
          {questions.questions.map((question, i) => (
            <div
              key={i}
              className="flex md:items-center rounded-md gap-2 md:gap-6 p-2 bg-picton-blue-50"
            >
              {i + 1}.
              <div className="flex flex-col md:flex-row items-start gap-2">
                {question.image &&
                  questions.algorithm ===
                    ActivityType.CompleteSentencesByDraggingCluesPics2 && (
                    <img
                      src={question.image}
                      alt="Question"
                      className="min-w-24 h-20 object-cover rounded-md"
                    />
                  )}
                <div className="flex flex-wrap items-center gap-2">
                  {question.question.split(" ").map((word, index) => {
                    if (word === "___") {
                      return answers[i] ? (
                        <div className="flex items-center" key={index}>
                          {showResults ? (
                            <div
                              className={cn(
                                "bg-picton-blue-200 rounded p-2 min-w-24 flex items-center justify-center",
                                {
                                  "h-12":
                                    questions.algorithm !==
                                    ActivityType.CompleteSentencesByDraggingCluesPics,
                                  "h-20 p-0":
                                    questions.algorithm ===
                                    ActivityType.CompleteSentencesByDraggingCluesPics,
                                  "text-green-700 bg-green-100":
                                    answers[i].value === question.answer,
                                  "text-red-700 bg-red-100":
                                    answers[i].value !== question.answer,
                                },
                              )}
                            >
                              {answers[i].image &&
                              questions.algorithm ===
                                ActivityType.CompleteSentencesByDraggingCluesPics ? (
                                <img
                                  src={answers[i].image}
                                  alt={answers[i].value}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                answers[i].value
                              )}
                            </div>
                          ) : (
                            <Draggable
                              id={i + "%" + answers[i].optionId + "%" + index}
                              data={{
                                type: i,
                              }}
                              className={cn(
                                "rounded flex-1 flex items-center min-w-32 border border-lemon-400 overflow-hidden justify-center bg-lemon-100 text-lemon-700",
                                {
                                  "h-12 p-2":
                                    questions.algorithm !==
                                    ActivityType.CompleteSentencesByDraggingCluesPics,
                                  "h-20":
                                    questions.algorithm ===
                                    ActivityType.CompleteSentencesByDraggingCluesPics,
                                },
                              )}
                              disabled={showResults}
                            >
                              {answers[i].image &&
                              questions.algorithm ===
                                ActivityType.CompleteSentencesByDraggingCluesPics ? (
                                <img
                                  src={answers[i].image}
                                  alt={answers[i].value}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                answers[i].value
                              )}
                            </Draggable>
                          )}
                          {showResults && (
                            <div className="ml-1">
                              {answers[i].value === question.answer ? (
                                <Check className="text-green-600" size={20} />
                              ) : (
                                <X className="text-red-600" size={20} />
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Droppable
                          key={index}
                          id={i + "%" + index}
                          data={{
                            type: i,
                          }}
                          isOverClassName="bg-lemon-100"
                          className={cn(
                            "bg-picton-blue-100 min-w-32 rounded flex items-center justify-center",
                            {
                              "h-12":
                                questions.algorithm !==
                                ActivityType.CompleteSentencesByDraggingCluesPics,
                              "h-20":
                                questions.algorithm ===
                                ActivityType.CompleteSentencesByDraggingCluesPics,
                            },
                          )}
                          disabled={showResults}
                        />
                      );
                    }

                    return <p key={index}>{word}</p>;
                  })}
                </div>
              </div>
            </div>
          ))}
        </DNDContext>

        {showResults && (
          <ActivityResults
            score={score}
            total={questions.questions.length}
            onRestart={handleTryAgain}
          />
        )}
      </div>

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

export default CompleteSentencesByDraggingCluesActivity;
