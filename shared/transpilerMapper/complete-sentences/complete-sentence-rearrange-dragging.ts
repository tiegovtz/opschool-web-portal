import { shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from "..";
import { ActivityType } from "@/lib/types/activity-types";

const completeSentenceRearrangeDraggingTranspiler = (
  params: ActivityTranspilerProps
) => {
  const {
    titleDescription,
    serverQuestions,
    algorithm,
    setWrongQuestionsFormat,
  } = params;
  let isWrongFormat = false;

  serverQuestions.some((question) => {
    if (!question.textOne) {
      isWrongFormat = true;
      return true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription.split("//")[0],
    questions: serverQuestions.map((q) => {
      const words = q.textOne?.replace(/[^\w\s]|_/g, "").split(" ") || [];
      //   console.log("Words: ", words);
      return {
        id: q.id,
        question:
          algorithm === ActivityType.CompleteSentencesByRearranging
            ? q.textOne
            : shuffle(words),
        answer:
          algorithm === ActivityType.CompleteSentencesByRearranging
            ? q.textOne
            : words,
        options: shuffle(words),
      };
    }),
  };
};

export default completeSentenceRearrangeDraggingTranspiler;
