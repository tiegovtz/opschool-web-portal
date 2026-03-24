// App.tsx
import { CheckIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Local imports
import { Input } from "../../../../../tie_open_school_primary_frontend/components/ui/input";
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import { cn, shuffle } from "@/lib/utils";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

type CountingMixedObjectsProps = {
  questions: {
    title: string;
    questions: { type: string; src: string; count: string }[];
  };
};

type Position = {
  x: number;
  y: number;
};

const CountingMixedObjectsActivity = ({
  questions,
}: CountingMixedObjectsProps) => {
  // Generate flattened array of all items based on their counts
  const generateItems = () => {
    const allItems: { id: string; type: string; src: string }[] = [];

    questions.questions.forEach((question) => {
      const count = parseInt(question.count);
      for (let i = 0; i < count; i++) {
        allItems.push({
          id: `${question.type}-${i}`,
          type: question.type,
          src: question.src,
        });
      }
    });

    return shuffle(allItems);
  };

  const [items, setItems] = useState(generateItems);
  const [questionsState, setQuestionsState] = useState(questions.questions);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [userCounts, setUserCounts] = useState<Record<string, string>>(() => {
    const initialCounts: Record<string, string> = {} as Record<string, string>;
    questionsState.forEach((q) => {
      initialCounts[q.type] = "";
    });
    return initialCounts;
  });
  // Add state for activity completion and results
  const [isCompleted, setIsCompleted] = useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [score, setScore] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerBounds, setContainerBounds] = useState({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  });

  const { playSound } = useSoundEffects();

  // Get container dimensions on mount and resize
  useEffect(() => {
    const updateContainerBounds = () => {
      if (containerRef.current) {
        const { width, height, left, top } =
          containerRef.current.getBoundingClientRect();
        setContainerBounds({ width, height, left, top });
      }
    };

    updateContainerBounds();
    window.addEventListener("resize", updateContainerBounds);

    return () => {
      window.removeEventListener("resize", updateContainerBounds);
    };
  }, [isCompleted]);

  // Check answers and calculate score
  const checkAnswers = () => {
    let correctCount = 0;

    questions.questions.forEach((question) => {
      if (userCounts[question.type] === question.count) {
        correctCount++;
      }
    });

    return correctCount;
  };

  // Handle activity completion
  const handleComplete = () => {
    const calculatedScore = checkAnswers();
    setScore(calculatedScore);
    setIsCompleted(true);
    setIsResultsDialogOpen(true);
    playSound("success");
  };

  // Handle activity restart
  const handleRestart = () => {
    setIsCompleted(false);
    setUserCounts(() => {
      const initialCounts: Record<string, string> = {} as Record<
        string,
        string
      >;
      questions.questions.forEach((q) => {
        initialCounts[q.type] = "";
      });
      return initialCounts;
    });
    // Regenerate and reshuffle items
    setItems(generateItems());
    setQuestionsState(shuffle(questions.questions));
    // Reset positions (they'll be recalculated on next render)
    setPositions({});
  };

  const handleCountChange = (type: string, value: string) => {
    // Only allow numeric input
    if (value === "" || /^\d+$/.test(value)) {
      setUserCounts((prev) => ({
        ...prev,
        [type]: value,
      }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={questions.title} />

      <div className="flex flex-col gap-4 h-full">
        <div className="flex flex-col md:flex-row gap-4 h-full">
          <div className="w-full h-full p-4 bg-picton-blue-50 rounded relative flex flex-wrap items-center justify-center gap-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="w-16 md:w-24 h-16 md:h-24 flex items-center justify-center bg-picton-blue-100 hover:scale-125 transition-transform duration-300 border border-picton-blue-300 rounded cursor-move"
              >
                <img
                  src={item.src}
                  alt={item.type}
                  className="max-w-full max-h-full"
                />
              </div>
            ))}
          </div>
          <div
            className={cn(
              "p-1 md:p-4 bg-picton-blue-50 rounded space-y-4 md:space-y-0",
              {
                "md:w-1/2": !isCompleted,
                "md:w-3/4": isCompleted,
              },
            )}
          >
            <div className="md:space-y-4 flex flex-row md:flex-col md:gap-4">
              {questionsState.map((question, i) => (
                <div
                  key={i}
                  className={`flex flex-col md:flex-row items-center md:space-x-3 md:p-2 rounded ${
                    isCompleted
                      ? userCounts[question.type] === question.count
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                      : ""
                  }`}
                >
                  <div className="h-10 md:h-14 flex items-center justify-center">
                    <img
                      src={question.src}
                      alt={question.type}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="inline-block mx-2 align-middle">
                      <Input
                        type="text"
                        value={userCounts[question.type]}
                        onChange={(e) =>
                          handleCountChange(question.type, e.target.value)
                        }
                        className={`max-w-24 rounded-none border-none bg-transparent text-center text-xl px-0 md:!text-4xl ${
                          isCompleted
                            ? userCounts[question.type] === question.count
                              ? "text-green-700"
                              : "text-red-700"
                            : "text-picton-blue-700"
                        }`}
                        maxLength={2}
                        disabled={isCompleted}
                      />
                      <div
                        className={`border-b border-dashed ${
                          isCompleted
                            ? userCounts[question.type] === question.count
                              ? "border-green-700"
                              : "border-red-700"
                            : "border-picton-blue-700"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1">
                      {/* Show feedback when completed or when user has entered a value */}
                      {isCompleted && (
                        <div className="text-sm mt-1">
                          <span
                            className={`font-semibold ${
                              isCompleted &&
                              userCounts[question.type] !== question.count
                                ? "text-red-700"
                                : userCounts[question.type] === question.count
                                  ? "text-green-700"
                                  : ""
                            }`}
                          >
                            {userCounts[question.type] === question.count ? (
                              <span>
                                Correct!{" "}
                                <CheckIcon className="inline" size={16} />
                              </span>
                            ) : isCompleted ? (
                              `Incorrect. Answer: ${question.count}`
                            ) : (
                              `Answer: ${question.count}`
                            )}
                          </span>
                          <div className="flex flex-wrap mt-1">
                            {[...Array(parseInt(question.count))].map(
                              (_, i) => (
                                <div
                                  key={i}
                                  className="w-8 h-8 m-1 flex items-center justify-center"
                                >
                                  <img
                                    src={question.src}
                                    alt={question.type}
                                    className="max-w-full max-h-full"
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!isCompleted && (
              <div className="w-fit mx-auto md:mx-0 md:ml-auto">
                <Button
                  onClick={handleComplete}
                  variant="brand-lemon"
                  disabled={Object.values(userCounts).some(
                    (value) => value === "",
                  )}
                >
                  Check Answers
                </Button>
              </div>
            )}
          </div>
        </div>

        {isCompleted && (
          <ActivityResults
            score={score}
            total={questions.questions.length}
            onRestart={handleRestart}
          />
        )}
      </div>

      {/* Results Dialog */}
      <ActivityResultsAlertDialog
        score={score}
        total={questions.questions.length}
        open={isResultsDialogOpen}
        onOpenChange={(open) => {
          setIsResultsDialogOpen(open);
        }}
      />
    </div>
  );
};

export default CountingMixedObjectsActivity;
