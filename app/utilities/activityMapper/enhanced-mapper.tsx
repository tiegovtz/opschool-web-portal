// enhancedActivityMapper.tsx
import { defineComponent, h, type DefineComponent } from "vue";



import activityComponents from "./index";
import type { ActivityComponentProps, ActivityType } from "~/types/activity-types";

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
 * Vue HOC Wrapper
 */
const withAnswerCollection = (ActivityComponent: any) => {
  return defineComponent<
    ActivityComponentProps & WithAnswerCollectionProps
  >({
    name: "WithAnswerCollection",

    props: {
      activityId: Number,
      studentProfileId: Number,
      parentAccountId: Number,
      sessionId: Number,
      questions: { type: null, required: true },
      feedback: String,
      isExamMode: Boolean,
      autoSaveAnswers: Boolean,
      onActivityComplete: Function,
      onAnswerRecorded: Function,
    },

    setup(props, { attrs }) {
      const handleAnswerRecorded = (
        questionIndex: number,
        answer: any,
        isCorrect?: boolean
      ) => {
        props.onAnswerRecorded?.(questionIndex, answer, isCorrect);
      };

      return () => h(
          ActivityComponent,{
          ...props,
          ...attrs,
          handleAnswerRecorded}
      );
    },
  });
};

/**
 * Enhanced mapper
 */
const createEnhancedActivityMapper = () => {
  const enhancedMapper: {
    [key in ActivityType]?: Component<
      ActivityComponentProps & WithAnswerCollectionProps
    >;
  } = {};

  Object.entries(activityComponents).forEach(
    ([activityTypeKey, ActivityComponent]) => {
      const activityType = activityTypeKey as ActivityType;

      if (ActivityComponent) {
        enhancedMapper[activityType] =
          withAnswerCollection(ActivityComponent);
      }
    }
  );

  return enhancedMapper;
};

export const enhancedActivityComponents = createEnhancedActivityMapper();