import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState } from "react";

// local imports
import { cn, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActivityType, FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useWindowSize } from "@/shared/hooks/use-window-size";
import { QuestionRenderer } from "@/components/activity-helpers";

type TCompleteSentencesByRephrasing = {
  feedback: FeedbackType;
  questions: {
    algorithm: ActivityType;
    title: string;
    fontSize?: number;
    questions: {
      id: number;
      question: string;
      image?: string | null;
      answer: string[];
    }[];
    options?: string[];
  };
  activityId?: number;
  studentProfileId?: number;
  parentAccountId?: number;
  sessionId?: number;
  autoSaveAnswers?: boolean;
};

const answerChecker = new AnswerChecker();

const CompleteSentencesByRephrasingActivity = ({
  questions,
}: TCompleteSentencesByRephrasing) => {
  const [shuffledQuestions, setShuffledQuestions] = useState(
    shuffle([...questions.questions]),
  );
  const { width } = useWindowSize();
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [feedbacks, setFeedbacks] = useState<{ [key: number]: boolean }>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const { playSound } = useSoundEffects();

  const shuffleQuestions = () => {
    setShuffledQuestions(shuffle([...questions.questions]));
  };

  // Check if all questions have been answered
  const allQuestionsAnswered = shuffledQuestions.every((_, index) => {
    const answer = answers[index];
    return answer && answer.trim() !== "";
  });

  // Custom reset function that also shuffles questions
  const handleResetWithShuffle = () => {
    shuffleQuestions();
    setScore(0);
    setAllAnswered(false);
    setCheckedItems([]);
    setAnswers({});
    setFeedbacks({});
    setShowResults(false);
    setStartTime(Date.now());
  };

  // Custom check function for all questions
  const handleCheckAllAnswers = async () => {
    let newScore = 0;
    const newFeedbacks: { [key: number]: boolean } = {};
    const newCheckedItems: number[] = [];

    shuffledQuestions.forEach((_, index) => {
      const userAnswer = answers[index] || "";
      const isCorrect = checkAnswer(userAnswer, index);

      newFeedbacks[index] = isCorrect;
      newCheckedItems.push(index);

      if (isCorrect) {
        newScore++;
      }
    });

    setScore(newScore);
    setFeedbacks(newFeedbacks);
    setCheckedItems(newCheckedItems);
    setAllAnswered(true);

    // Play sound based on overall performance
    playSound(newScore === shuffledQuestions.length ? "success" : "failure");
  };

  const handleInputChange = (index: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const visibleQuestions = shuffledQuestions;

  const checkAnswer = (userAnswer: string, questionIndex: number) => {
    // Split user answers by comma and trim each answer
    const userAnswers = userAnswer
      .split("|")
      .map((ans: string) => ans.trim().toLowerCase());
    const correctAnswers = shuffledQuestions[questionIndex].answer.map(
      (ans: string) => ans.toLowerCase(),
    );

    // Check if all answers match their corresponding correct answers
    return (
      (questions.algorithm === ActivityType.CompleteSentencesByRephrasing ||
        questions.algorithm ===
          ActivityType.CompleteSentenceByRephrasingWithChoices ||
        userAnswers.length === correctAnswers.length) &&
      userAnswers.every(
        (ans: string, i: number) =>
          answerChecker.checkAnswer(ans, {
            acceptedAnswers:
              questions.algorithm ===
                ActivityType.CompleteSentencesByRephrasing ||
              questions.algorithm ===
                ActivityType.CompleteSentenceByRephrasingWithChoices
                ? correctAnswers
                : [correctAnswers[i]],
            strictMode: true,
          }).isCorrect,
      )
    );
  };

  const renderQuestion = (
    q: { question: string; answer: string[] },
    i: number,
  ) => {
    const actualIndex = i;
    const userAnswers = answers[actualIndex]
      ? answers[actualIndex].split("|")
      : [];

    const handleBlankChange = (blankIndex: number, value: string) => {
      const newUserAnswers = [...userAnswers];
      newUserAnswers[blankIndex] = value;
      const newAnswerString = newUserAnswers.join("|");
      handleInputChange(i, newAnswerString);
    };

    return (
      <QuestionRenderer
        question={q.question}
        answers={q.answer}
        userAnswers={userAnswers}
        mode="activity"
        isChecked={checkedItems.includes(actualIndex)}
        disabled={checkedItems.includes(actualIndex)}
        screenWidth={width}
        onBlankChange={handleBlankChange}
        colorScheme={checkedItems.includes(actualIndex) ? "yellow" : "default"}
      />
    );
  };

  // console.log(questions.algorithm);

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      <div
        className="flex flex-col h-full bg-picton-blue-100 gap-2 text-lg"
        style={{
          fontSize:
            width > 600
              ? questions.fontSize
                ? `${questions.fontSize}px`
                : "20px"
              : undefined,
        }}
      >
        {questions.options && questions.options.length > 0 && (
          <div className="flex flex-wrap gap-4 border-2 border-picton-blue-300 bg-picton-blue-200 w-fit py-4 rounded">
            {questions.options.filter((o) => o.trim() !== "").length > 0 &&
              questions.options.map((option, index) => (
                <span
                  key={index}
                  className="text-picton-blue-700 leading-4 px-3"
                >
                  {option}
                </span>
              ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {visibleQuestions.map((q, i) => {
            const actualIndex = i;

            return (
              <div
                key={q.id}
                className="flex items-start md:items-center gap-2"
              >
                <motion.div
                  // key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={cn(
                    "rounded-lg min-h-[80px] p-2 flex items-center flex-1 w-full overflow-x-auto",
                    {
                      "bg-picton-blue-50": !checkedItems.includes(actualIndex),
                      "bg-lemon-50 text-lemon-700":
                        checkedItems.includes(actualIndex),
                      "bg-green-100 text-green-700": feedbacks[actualIndex],
                      "bg-red-100 text-red-700":
                        feedbacks[actualIndex] === false,
                    },
                  )}
                >
                  <div className="py-2 flex items-center justify-between md:w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 md:w-full">
                      <div>
                        <span>{i + 1}.</span>
                        <div className="inline">{renderQuestion(q, i)}</div>
                      </div>
                      {q.image && (
                        <div className="min-w-[150px] h-32 md:h-28">
                          <img
                            src={q.image}
                            alt={q.question}
                            className="w-full h-full rounded-lg object-contain"
                          />
                        </div>
                      )}
                    </div>
                    {checkedItems.includes(actualIndex) && (
                      <div className="flex items-center gap-2">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            "flex items-center justify-center rounded-full p-1",
                            feedbacks[actualIndex]
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600",
                          )}
                        >
                          {feedbacks[actualIndex] ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <X className="h-5 w-5" />
                          )}
                        </motion.div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Single Check Answers Button */}
        {showResults ? (
          <ActivityResults
            score={score}
            total={shuffledQuestions.length}
            onRestart={handleResetWithShuffle}
          />
        ) : (
          <div className="relative flex justify-end">
            <Button
              disabled={!allQuestionsAnswered || allAnswered}
              onClick={handleCheckAllAnswers}
              variant="brand-lemon"
              size="lg"
            >
              {allAnswered ? "Answers Checked" : "Check Answers"}
            </Button>
          </div>
        )}
      </div>

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

export default CompleteSentencesByRephrasingActivity;
