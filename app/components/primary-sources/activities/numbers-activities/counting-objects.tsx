import { Check, X, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

// local imports
import { cn, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type CountingObjectsActivityProps = {
  feedback: FeedbackType;
  questions: {
    title: string;
    questions: {
      id: number;
      number: number;
    }[];
  };
};

const answerChecker = new AnswerChecker();

// Colors for different place values (3D cube colors)
const PLACE_VALUE_COLORS = [
  "#ef4444", // red for ones
  "#3b82f6", // blue for tens
  "#10b981", // green for hundreds
  "#f59e0b", // amber for thousands
  "#8b5cf6", // purple for ten thousands
  "#ec4899", // pink for hundred thousands
  "#6366f1", // indigo for millions
  "#f97316", // orange for ten millions
];

const PLACE_VALUE_LABELS = [
  "Ones",
  "Tens",
  "Hundreds",
  "Thousands",
  "Ten Thousands",
  "Hundred Thousands",
  "Millions",
  "Ten Millions",
];

// 3D cube sizes for different place values (reduced sizes to fit better)
const PLACE_VALUE_SIZES = [
  20, // ones (reduced from 25)
  30, // tens (reduced from 40)
  45, // hundreds (reduced from 60)
  70, // thousands (reduced from 100)
  60, // ten thousands (reduced from 80)
  55, // hundred thousands (reduced from 70)
  50, // millions (reduced from 65)
  65, // ten millions (reduced from 85)
];

const CountingObjectsActivity = ({
  questions,
  feedback,
}: CountingObjectsActivityProps) => {
  const [shuffledQuestions, setShuffledQuestions] = useState([
    ...questions.questions,
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [feedbacks, setFeedbacks] = useState<{ [key: number]: boolean }>({});
  const [showResults, setShowResults] = useState(false);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  const { playSound } = useSoundEffects();

  const shuffleQuestions = () => {
    setShuffledQuestions(shuffle([...questions.questions]));
  };

  // Shuffle questions on initial render
  useEffect(() => {
    shuffleQuestions();
  }, [questions.questions]);

  // Reset answer state when question changes
  useEffect(() => {
    setUserAnswer(answers[currentQuestionIndex] || "");
    setIsAnswerChecked(false);
  }, [currentQuestionIndex, answers]);

  const getPlaceValueBreakdown = (number: number) => {
    const digits = number.toString().split("").reverse();
    return digits
      .map((digit, index) => ({
        digit: parseInt(digit),
        placeValue: Math.pow(10, index),
        label: PLACE_VALUE_LABELS[index],
        color: PLACE_VALUE_COLORS[index % PLACE_VALUE_COLORS.length],
        size: PLACE_VALUE_SIZES[index % PLACE_VALUE_SIZES.length],
        position: index,
      }))
      .reverse();
  };

  const renderSimpleCube = (size: number, color: string, index: number) => {
    return (
      <div
        key={index}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          margin: "2px",
          display: "inline-block",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: "rotateX(-10deg) rotateY(-10deg)",
          flexShrink: 0,
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `translateZ(${size / 2}px)`,
          }}
        />

        {/* Back face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `translateZ(-${size / 2}px) rotateY(180deg)`,
          }}
        />

        {/* Right face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            filter: "brightness(0.7)",
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `rotateY(90deg) translateZ(${size / 2}px)`,
          }}
        />

        {/* Left face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            filter: "brightness(0.7)",
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `rotateY(-90deg) translateZ(${size / 2}px)`,
          }}
        />

        {/* Top face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            filter: "brightness(1.2)",
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `rotateX(90deg) translateZ(${size / 2}px)`,
          }}
        />

        {/* Bottom face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            filter: "brightness(0.5)",
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `rotateX(-90deg) translateZ(${size / 2}px)`,
          }}
        />
      </div>
    );
  };

  const renderPlaceValueBoxes = (
    digit: number,
    color: string,
    size: number
  ) => {
    if (digit === 0) return null;

    let styles = "";

    if (size <= 25) {
      // ones
      styles = "grid-cols-1 gap-2";
    } else if (size <= 40) {
      // tens
      styles = "grid-cols-2 gap-3";
    } else if (size <= 60) {
      // hundreds
      styles = "grid-cols-3 gap-4";
    } else {
      // thousands and above
      styles = "grid-cols-3 gap-10";
    }

    return (
      <div
        className={cn(
          "grid justify-items-center",
          // `grid-cols-${gridCols}`,
          styles
        )}
      >
        {Array.from({ length: digit }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: i * 0.05,
              type: "spring",
              stiffness: 200,
            }}
          >
            {renderSimpleCube(size, color, i)}
          </motion.div>
        ))}
      </div>
    );
  };

  const checkCurrentAnswer = () => {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const isCorrect = answerChecker.checkAnswer(userAnswer, {
      acceptedAnswers: [currentQuestion.number.toString()],
      strictMode: false,
    }).isCorrect;

    setFeedbacks((prev) => ({
      ...prev,
      [currentQuestionIndex]: isCorrect,
    }));

    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: userAnswer,
    }));

    setIsAnswerChecked(true);

    if (isCorrect) {
      setScore((prev) => prev + 1);
      playSound("correct");
    } else {
      playSound("failure");
    }

    // Auto proceed to next question after a delay, or finish if last question
    setTimeout(() => {
      if (currentQuestionIndex < shuffledQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setIsAnswerChecked(false);
        setUserAnswer("");
      } else {
        // All questions completed
        setAllAnswered(true);
      }
    }, 1500);
  };

  const handleResetWithShuffle = () => {
    shuffleQuestions();
    setCurrentQuestionIndex(0);
    setScore(0);
    setAllAnswered(false);
    setUserAnswer("");
    setAnswers({});
    setFeedbacks({});
    setShowResults(false);
    setIsAnswerChecked(false);
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const placeValueBreakdown = getPlaceValueBreakdown(currentQuestion.number);
  const isCurrentAnswerCorrect = feedbacks[currentQuestionIndex];

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      {!showResults ? (
        <div className="flex flex-col h-full bg-picton-blue-100">
          <div className="flex-1 overflow-y-auto py-2">
            <div
              key={currentQuestionIndex}
              className="bg-white rounded-lg p-6 shadow-sm"
            >
              {/* Place Value Visualization */}
              <div className="flex gap-6 mb-8 justify-between">
                {placeValueBreakdown.map((place, index) => (
                  <motion.div
                    key={`${currentQuestionIndex}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="bg-gray-50 rounded-lg p-4 border text-center grow"
                  >
                    <h4 className="font-medium text-neutral-700 text-2xl mb-3">
                      {place.label}
                    </h4>
                    <div className="min-h-[480px] flex items-center justify-center">
                      {place.digit === 0 ? (
                        <div className="text-gray-400 italic">
                          No {place.label.toLowerCase()}
                        </div>
                      ) : (
                        renderPlaceValueBoxes(
                          place.digit,
                          place.color,
                          place.size
                        )
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row md:justify-end items-center gap-4">
                {/* Answer Input */}
                <div>
                  <div className="flex items-center gap-4">
                    <Input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={isAnswerChecked}
                      className="max-w-xs !text-2xl text-center"
                      placeholder="Enter the number"
                    />
                    {isAnswerChecked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "flex items-center justify-center rounded-full p-2",
                          isCurrentAnswerCorrect
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        )}
                      >
                        {isCurrentAnswerCorrect ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <X className="h-6 w-6" />
                        )}
                      </motion.div>
                    )}
                  </div>

                  {isAnswerChecked &&
                    !isCurrentAnswerCorrect &&
                    feedback === "wrong-correct-answers" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <p className="text-red-700 text-sm">
                          Correct answer:{" "}
                          <strong>
                            {currentQuestion.number.toLocaleString()}
                          </strong>
                        </p>
                      </motion.div>
                    )}
                </div>

                <div className="flex gap-3">
                  {!isAnswerChecked ? (
                    <Button
                      onClick={checkCurrentAnswer}
                      disabled={!userAnswer.trim()}
                      variant="brand-lemon"
                    >
                      {currentQuestionIndex < shuffledQuestions.length - 1
                        ? "Next Question"
                        : "Check Answer"}
                    </Button>
                  ) : (
                    <Button
                      variant="brand-lemon"
                      disabled={true}
                      className="flex items-center gap-2"
                    >
                      {currentQuestionIndex < shuffledQuestions.length - 1 ? (
                        <>
                          Moving to Next...
                          <ChevronRight className="h-4 w-4" />
                        </>
                      ) : (
                        "Finishing Activity..."
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 p-4 bg-white">
            {shuffledQuestions.map((_, index) => {
              const isAnswered = answers[index] !== undefined;
              const isCorrect = feedbacks[index];
              const isCurrent = index === currentQuestionIndex;

              return (
                <div
                  key={index}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                    {
                      "bg-picton-blue-200": !isAnswered && !isCurrent,
                      "bg-lemon-200": isAnswered,
                      "border-2 border-picton-blue-500":
                        isCurrent && !isAnswered,
                      "border-2 border-lemon-500": isCurrent && isAnswered,
                    }
                  )}
                >
                  {isAnswered && (
                    <div className="absolute">
                      {isCorrect ? (
                        <Check className="text-green-500" size={16} />
                      ) : (
                        <X className="text-red-500" size={16} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-picton-blue-100 text-lg p-6 overflow-y-auto">
          <div className="bg-picton-blue-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {shuffledQuestions.map((question, idx) => {
                const userAnswerForQuestion = answers[idx] || "";
                const isCorrect = feedbacks[idx];

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-lg border",
                      isCorrect
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium">Question {idx + 1}</p>
                        <p className="text-sm text-gray-600">
                          Number: {question.number.toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-full p-1",
                          isCorrect
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        )}
                      >
                        {isCorrect ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">Your answer:</p>
                        <p
                          className={cn(
                            "font-medium",
                            isCorrect ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {userAnswerForQuestion || "(no answer)"}
                        </p>
                      </div>
                      {feedback === "wrong-correct-answers" && !isCorrect && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Correct answer:
                          </p>
                          <p className="text-green-600 font-medium">
                            {question.number.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <ActivityResults
              score={score}
              total={shuffledQuestions.length}
              onRestart={handleResetWithShuffle}
            />
          </div>
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={shuffledQuestions.length}
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

export default CountingObjectsActivity;
