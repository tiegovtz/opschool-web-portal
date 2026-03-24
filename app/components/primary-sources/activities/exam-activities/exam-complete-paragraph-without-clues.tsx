"use client";

import { Fragment, useState, useEffect } from "react";

// local imports
import { cn } from "@/lib/utils";
import { Input } from "../../../../../../tie_open_school_primary_frontend/components/ui/input";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useExamContext } from "@/shared/context/exam-context";
import { QuestionAnswer } from "@/shared/context/exam-context";

export type ExamCompleteParagraphWithoutCluesProps = {
  questions: {
    title: string;
    paragraph: string;
    image?: string;
    answers: string[];
    options?: string[];
    withClues: boolean;
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const answerChecker = new AnswerChecker();

const ExamCompleteParagraphWithoutClues = ({
  questions,
  activityIndex,
  activityId,
  onStateUpdate,
}: ExamCompleteParagraphWithoutCluesProps) => {
  const [userAnswers, setUserAnswers] = useState<string[]>(
    Array.from({ length: questions.answers.length }, () => "")
  );

  const { collectAnswers, updateActivityScore } = useExamContext();

  const totalQuestions = questions.answers.length;

  // Calculate score for this activity
  const calculateScore = () => {
    let score = 0;
    const detailedAnswers: QuestionAnswer[] = [];

    userAnswers.forEach((answer, index) => {
      const isCorrect = answerChecker.checkAnswer(answer, {
        acceptedAnswers: [questions.answers[index]],
      }).isCorrect;

      if (isCorrect) {
        score++;
      }

      // Store detailed answer information
      detailedAnswers.push({
        questionId: `blank-${index}`,
        userAnswer: answer,
        correctAnswer: questions.answers[index],
        isCorrect,
        question: questions.paragraph,
        options: questions.options || [],
      });
    });

    return { score, answers: detailedAnswers };
  };

  // Update exam context whenever answers change
  useEffect(() => {
    if (!collectAnswers) return;

    const { score, answers } = calculateScore();
    updateActivityScore(activityIndex, {
      activityId,
      activityIndex,
      score,
      totalQuestions,
      answers,
    });
  }, [collectAnswers]);

  useEffect(() => {
    const answeredCount = userAnswers.filter(
      (answer) => answer.trim() !== ""
    ).length;
    onStateUpdate?.(totalQuestions, answeredCount);
  }, [userAnswers]);

  const handleInputChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const renderParagraphWithInputs = () => {
    const paragraphParts = questions.paragraph.split("___");

    return (
      <div className="text-lg leading-loose">
        {paragraphParts.map((part, i) => (
          <Fragment key={i}>
            <span>{part}</span>
            {i < paragraphParts.length - 1 && (
              <span className="inline-block mx-2 align-middle">
                <Input
                  type="text"
                  value={userAnswers[i]}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  className="max-w-40 rounded-none border-none bg-transparent text-picton-blue-700 text-center !text-lg focus:bg-picton-blue-50"
                />
                <div className="border-b border-dashed border-picton-blue-700" />
              </span>
            )}
          </Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col rounded-xl">
      {/* Content container - scrollable */}
      <div className="md:grid md:grid-cols-3 h-full min-h-[400px]">
        {/* Main paragraph area */}
        <div
          className={cn(
            "bg-white flex col-span-2 flex-col overflow-auto border-r gap-2 h-full w-full md:rounded-bl-xl p-4",
            {
              "md:col-span-3": !questions.image,
            }
          )}
        >
          {/* Options section for activities with clues */}
          {questions.withClues && questions.options && (
            <div>
              {/*<h3 className="font-semibold text-picton-blue-700">Options</h3>*/}
              <div className="flex flex-wrap gap-2 bg-picton-blue-100 border-2 border-picton-blue-300 w-fit py-4 rounded">
                {questions.options.map((option, i) => (
                  <span
                    key={i}
                    className="text-picton-blue-700 text-base leading-4 px-3"
                  >
                    {option}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-lg leading-loose">
            {renderParagraphWithInputs()}
          </div>
        </div>

        {/* Image section if available */}
        {questions.image && (
          <div className="bg-white flex items-center justify-center rounded-br-xl rounded-bl-xl md:rounded-bl-none p-4">
            <img
              src={questions.image}
              alt="Activity illustration"
              className="object-contain w-full max-h-[400px] rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamCompleteParagraphWithoutClues;
