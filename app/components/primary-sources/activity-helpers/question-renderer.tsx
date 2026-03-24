"use client";

import { memo, useMemo, Fragment } from "react";
import { InlineMath } from "react-katex";
import { cn, extractKatexSegments } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/input";
import {
  FractionInput,
  detectFractionPattern,
  getEmptyFractionValue,
} from "@/components/fraction-input";
import {
  CompoundUnitArithmeticInput,
  detectCompoundUnitArithmeticPattern,
  getEmptyCompoundUnitArithmeticValue,
} from "@/components/compound-unit-arithmetic-input";
import {
  parseQuestionSegments,
  calculateBlankWidth,
  QuestionSegment,
} from "./question-renderer-utils";

// Memoized MathText component for optimized KaTeX rendering
const MathText = memo(
  ({ text, className = "" }: { text: string; className?: string }) => {
    const segments = useMemo(() => extractKatexSegments(text), [text]);

    const hasMath = useMemo(
      () => segments.some((seg) => seg.type === "math"),
      [segments],
    );

    if (!hasMath) {
      return (
        <span className={cn("whitespace-pre-line", className)}>{text}</span>
      );
    }

    return (
      <span className={className}>
        {segments.map((seg, i) =>
          seg.type === "math" ? (
            <InlineMath key={i}>{seg.value}</InlineMath>
          ) : (
            <Fragment key={i}>{seg.value}</Fragment>
          ),
        )}
      </span>
    );
  },
);

MathText.displayName = "MathText";

export type QuestionRendererMode = "activity" | "exam" | "results";

export interface QuestionRendererProps {
  question: string;
  answers: string[]; // Array of correct answers for each blank
  userAnswers?: string[]; // Array of user's answers for each blank
  mode?: QuestionRendererMode;
  isChecked?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
  screenWidth?: number;
  onBlankChange?: (blankIndex: number, value: string) => void;
  highlightClassName?: string;
  textClassName?: string;
  blankClassName?: string;
  colorScheme?: "default" | "green" | "red" | "yellow";
}

/**
 * Reusable component for rendering questions with KaTeX, blanks, and highlighted text
 *
 * @example Activity mode
 * <QuestionRenderer
 *   question="The answer is $x + y = __$ and _correct"
 *   answers={["5"]}
 *   userAnswers={["5"]}
 *   mode="activity"
 *   isChecked={true}
 *   isCorrect={true}
 *   onBlankChange={(idx, val) => handleChange(idx, val)}
 * />
 *
 * @example Exam mode
 * <QuestionRenderer
 *   question="Solve: __ + __ = 10"
 *   answers={["3", "7"]}
 *   userAnswers={["3", ""]}
 *   mode="exam"
 *   onBlankChange={(idx, val) => handleChange(idx, val)}
 * />
 *
 * @example Results mode
 * <QuestionRenderer
 *   question="The result is __"
 *   answers={["correct"]}
 *   userAnswers={["wrong"]}
 *   mode="results"
 *   isCorrect={false}
 * />
 */
export const QuestionRenderer = memo(
  ({
    question,
    answers,
    userAnswers = [],
    mode = "activity",
    isChecked = false,
    isCorrect = false,
    disabled = false,
    screenWidth = 1024,
    onBlankChange,
    highlightClassName,
    textClassName,
    blankClassName,
    colorScheme = "default",
  }: QuestionRendererProps) => {
    // Parse question into segments
    const segments = useMemo(() => parseQuestionSegments(question), [question]);

    let blankCount = 0;

    const getBlankColorClasses = (blankIsCorrect: boolean) => {
      if (mode === "results") {
        return blankIsCorrect
          ? "bg-green-100 text-green-800 border-green-300"
          : "bg-red-100 text-red-800 border-red-300";
      }

      if (isChecked) {
        if (colorScheme === "yellow") {
          return "border-lemon-700";
        }
        return blankIsCorrect
          ? "border-green-500 bg-green-50"
          : "border-red-500 bg-red-50";
      }

      switch (colorScheme) {
        case "green":
          return "border-green-500";
        case "red":
          return "border-red-500";
        case "yellow":
          return "border-lemon-700";
        default:
          return "border-picton-blue-300";
      }
    };

    return (
      <>
        {segments.map((segment) => {
          // Handle blank segments (inputs)
          if (segment.type === "blank") {
            const blankIndex = blankCount;
            blankCount++;

            const userAnswer = userAnswers[blankIndex] || "";
            const correctAnswer = answers[blankIndex] || "";

            // Check for compound unit arithmetic pattern FIRST
            const { isCompoundUnitArithmetic, columnCount } =
              detectCompoundUnitArithmeticPattern(correctAnswer);

            if (isCompoundUnitArithmetic) {
              const blankIsCorrect =
                mode === "results"
                  ? isCorrect
                  : userAnswer.toLowerCase().trim() ===
                    correctAnswer.toLowerCase().trim();

              return (
                <span
                  key={`blank-${segment.index}`}
                  className="inline-flex mx-1 relative"
                >
                  <CompoundUnitArithmeticInput
                    value={
                      userAnswer ||
                      getEmptyCompoundUnitArithmeticValue(columnCount)
                    }
                    onChange={(value) => {
                      if (onBlankChange && !disabled) {
                        onBlankChange(blankIndex, value);
                      }
                    }}
                    disabled={disabled || mode === "results"}
                    readOnly={mode === "results"}
                    isChecked={isChecked || mode === "results"}
                    colorScheme={
                      mode === "results"
                        ? blankIsCorrect
                          ? "green"
                          : "red"
                        : colorScheme === "default"
                          ? "blue"
                          : colorScheme
                    }
                    columnCount={columnCount}
                    correctAnswer={correctAnswer}
                  />
                </span>
              );
            }

            const { isFraction, isMixed: isMixedFraction } =
              detectFractionPattern(correctAnswer);

            // Check if this specific blank is correct
            const blankIsCorrect =
              mode === "results"
                ? isCorrect
                : userAnswer.toLowerCase().trim() ===
                  correctAnswer.toLowerCase().trim();

            // Render FractionInput for fraction answers
            if (isFraction) {
              return (
                <span
                  key={`blank-${segment.index}`}
                  className="inline-flex mx-1 relative"
                >
                  <FractionInput
                    value={userAnswer || getEmptyFractionValue(isMixedFraction)}
                    onChange={(value) => {
                      if (onBlankChange && !disabled) {
                        onBlankChange(blankIndex, value);
                      }
                    }}
                    disabled={disabled || mode === "results"}
                    readOnly={mode === "results"}
                    isMixed={isMixedFraction}
                    isChecked={isChecked || mode === "results"}
                    colorScheme={
                      mode === "results"
                        ? blankIsCorrect
                          ? "green"
                          : "red"
                        : colorScheme === "default"
                          ? undefined
                          : colorScheme
                    }
                  />
                </span>
              );
            }

            // Calculate width for regular inputs
            const underscoreCount = segment.content.length;
            const { calculatedWidth, isTwoUnderscores } = calculateBlankWidth(
              underscoreCount,
              screenWidth,
            );

            // Render regular text Input
            return (
              <span
                key={`blank-${segment.index}`}
                className={cn("inline-flex mx-1", blankClassName, {
                  "flex-col": !isTwoUnderscores,
                })}
                style={{ width: `${calculatedWidth}px` }}
              >
                <Input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => {
                    if (onBlankChange && !disabled) {
                      onBlankChange(blankIndex, e.target.value);
                    }
                  }}
                  disabled={disabled || mode === "results"}
                  readOnly={mode === "results"}
                  className={cn("min-w-0 px-2 text-center bg-transparent", {
                    "border-none focus:outline-none": !isTwoUnderscores,
                    "border rounded": isTwoUnderscores,
                    [getBlankColorClasses(blankIsCorrect)]: true,
                  })}
                  style={{ maxWidth: `${calculatedWidth * 1.6}px` }}
                />
                {!isTwoUnderscores && (
                  <div
                    className={cn("border-b border-dashed", {
                      "border-picton-blue-700":
                        !isChecked && colorScheme === "default",
                      "border-lemon-700": isChecked && colorScheme === "yellow",
                      "border-green-500":
                        isChecked &&
                        blankIsCorrect &&
                        colorScheme === "default",
                      "border-red-500":
                        isChecked &&
                        !blankIsCorrect &&
                        colorScheme === "default",
                    })}
                  />
                )}
              </span>
            );
          }

          // Handle highlighted text segments
          if (segment.type === "highlighted") {
            return (
              <span
                key={`highlighted-${segment.index}`}
                className={cn(
                  "bg-picton-blue-200 text-picton-blue-700 px-2 rounded mx-1 items-center leading-loose",
                  highlightClassName,
                )}
              >
                <MathText text={segment.content} />
              </span>
            );
          }

          // Handle regular text segments (with KaTeX support)
          return (
            <span
              key={`text-${segment.index}`}
              className={cn("mx-1 items-center leading-loose", textClassName)}
            >
              <MathText text={segment.content} />
            </span>
          );
        })}
      </>
    );
  },
);

QuestionRenderer.displayName = "QuestionRenderer";

export default QuestionRenderer;
