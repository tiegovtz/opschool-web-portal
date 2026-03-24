import React from "react";
import {
  ActivityComponentProps,
  ActivityType,
} from "@/lib/types/activity-types";

// Import the original activity mapper
import activityComponents from "./index";

interface WithAnswerCollectionProps {
  activityId?: number;
  studentProfileId?: number;
  parentAccountId?: number;
  sessionId?: number;
  questions: any;
  feedback?: "wrong-correct" | "wrong-correct-answers" | "none";
  isExamMode?: boolean;
  autoSaveAnswers?: boolean;
  onActivityComplete?: (
    score: number,
    totalQuestions: number,
    userAnswers: any[],
    savedAnswers?: any[],
  ) => void;
  onAnswerRecorded?: (
    questionIndex: number,
    answer: any,
    isCorrect?: boolean,
  ) => void;
}

/**
 * Enhanced activity wrapper that adds answer collection to any activity
 */
const withAnswerCollection = (ActivityComponent: React.ComponentType<any>) => {
  return (props: WithAnswerCollectionProps) => {
    const {
      activityId,
      studentProfileId,
      parentAccountId,
      sessionId,
      autoSaveAnswers = false,
      onActivityComplete,
      onAnswerRecorded,
      ...restProps
    } = props;

    return (
      <ActivityComponent
        {...restProps}
        activityId={activityId}
        studentProfileId={studentProfileId}
        parentAccountId={parentAccountId}
        sessionId={sessionId}
        autoSaveAnswers={autoSaveAnswers}
      />
    );
  };
};

/**
 * Enhanced activity mapper with answer collection capabilities
 * This wraps all existing activities with the answer collection functionality
 */
const createEnhancedActivityMapper = () => {
  const enhancedMapper: {
    [key in ActivityType]?: React.ComponentType<
      ActivityComponentProps & WithAnswerCollectionProps
    >;
  } = {};

  // Iterate through all activity types and create enhanced versions
  Object.entries(activityComponents).forEach(
    ([activityTypeKey, ActivityComponent]) => {
      const activityType = activityTypeKey as ActivityType;

      if (ActivityComponent) {
        enhancedMapper[activityType] = withAnswerCollection(ActivityComponent);
      }
    },
  );

  return enhancedMapper;
};

// Create the enhanced activity mapper
const enhancedActivityComponents = createEnhancedActivityMapper();

export default enhancedActivityComponents;
