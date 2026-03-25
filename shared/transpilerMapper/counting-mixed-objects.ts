import { ActivityTranspilerProps } from ".";
import { getImageUrl, shuffle } from "@/lib/utils";

const CountingMixedObjectsTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, titleDescription } = params;

  return {
    title: titleDescription,
    questions: shuffle(
      serverQuestions.map((item) => {
        return {
          type: item.id.toString(),
          src: getImageUrl(item.path || ""),
          count: item.textOne,
        };
      })
    ),
  };
};

export default CountingMixedObjectsTranspiler;
