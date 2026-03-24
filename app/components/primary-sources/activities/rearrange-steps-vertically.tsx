import { useState, useEffect } from "react";

// Local imports
import { shuffle } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/input";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

// Define the type for the component props
type RearrangeStepsVerticallyActivityProps = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: {
      text: string;
      order: number;
    }[];
  };
};

const RearrangeStepsVerticallyActivity = ({
  feedback,
  questions,
}: RearrangeStepsVerticallyActivityProps) => {
  // State to keep track of the score
  const [score, setScore] = useState(0);
  // State to check if all questions are answered
  const [allAnswered, setAllAnswered] = useState(false);
  // State to show feedback
  const [showFeedback, setShowFeedback] = useState(false);
  // State to store the questions
  const [theQuestions, setTheQuestions] = useState<
    {
      text: string;
      order: number;
    }[]
  >(questions.questions);
  // State to store the order of answers
  const [order, setOrder] = useState<string[]>(
    Array(questions.questions.length).fill("")
  );

  const { playSound } = useSoundEffects();

  // Effect to calculate the score when the order changes
  useEffect(() => {
    if (order.every((order) => order !== "")) {
      const newScore = order.reduce((acc, order, index) => {
        if (Number(order) === theQuestions[index].order) {
          return acc + 1;
        }
        return acc;
      }, 0);
      setScore(newScore);
      setAllAnswered(true);
      playSound("success");
    }
  }, [order, theQuestions]);

  // Handle change in input value
  const handleChange = (index: number, value: string) => {
    if (value === "") {
      setOrder(order.map((order, i) => (i === index ? "" : order)));
    } else if (
      !isNaN(Number(value)) &&
      Number(value) > 0 &&
      Number(value) <= theQuestions.length
    ) {
      const newOrder = [...order];

      // Set the new value at the current index
      newOrder[index] = value;
      setOrder(newOrder);
    }
  };

  // Reset activity
  const resetActivity = () => {
    setAllAnswered(false);
    setShowFeedback(false);
    setScore(0);
    setOrder(Array(theQuestions.length).fill(""));
    setTheQuestions(shuffle(questions.questions));
  };

  // Check if answer is correct
  const isAnswerCorrect = (index: number) => {
    return Number(order[index]) === theQuestions[index].order;
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      <ul className="mt-4 flex flex-col justify-between gap-1">
        {theQuestions.map((question, index) => {
          const isCorrect = isAnswerCorrect(index);
          const answered = order[index] !== "";
          const showInputFeedback = showFeedback && answered;

          return (
            <li key={index} className="rounded text-lg flex gap-4 items-center">
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  value={order[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  className={`w-16 h-16 no-number-input-arrows text-center text-2xl ${
                    showInputFeedback
                      ? isCorrect
                        ? "bg-green-100 border-green-500"
                        : "bg-red-100 text-red-700 border-red-500"
                      : "bg-picton-blue-200"
                  }`}
                  disabled={showFeedback}
                />
                {showInputFeedback &&
                  !isCorrect &&
                  feedback === "wrong-correct-answers" && (
                    <div className="absolute right-0 top-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      {question.order}
                    </div>
                  )}
              </div>
              <span
                className={
                  showInputFeedback && !isCorrect ? "text-red-500" : ""
                }
              >
                {question.text}
              </span>
            </li>
          );
        })}
      </ul>

      {showFeedback && (
        <ActivityResults
          score={score}
          total={theQuestions.length}
          onRestart={resetActivity}
        />
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={theQuestions.length}
        open={allAnswered}
        onOpenChange={(open) => {
          if (!open) {
            if (feedback === "none") {
              resetActivity();
            } else {
              setShowFeedback(true);
            }
            setAllAnswered(false);
          }
        }}
      />
    </div>
  );
};

export default RearrangeStepsVerticallyActivity;
