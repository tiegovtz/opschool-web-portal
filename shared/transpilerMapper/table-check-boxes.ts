import { getImageUrl, shuffle } from "@/lib/utils";
import { ActivityTranspilerProps } from ".";

const tableCheckBoxesTranspiler = (params: ActivityTranspilerProps) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;
  let isWrongFormat = false;

  // TODO: Implement logic to check if the questions are in the correct format

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  const rowQuestions = serverQuestions.slice(1).map((question) => {
    const text = question.textOne?.split("/")[0].trim() || "";
    return {
      id: text.toLowerCase().replace(/\s+/g, "_"),
      text,
      image: getImageUrl(question.path || ""),
    };
  });

  const columnQuestions = serverQuestions[0].textOne
    ?.split("/")
    .slice(1)
    .map((text) => ({
      id: text.trim().toLowerCase().replace(/\s+/g, "_"),
      text: text.trim(),
    })) as Array<{ id: string; text: string; image?: string }>;

  const correctAnswers = rowQuestions.reduce<
    Record<string, Record<string, boolean>>
  >((acc, row) => {
    const question = serverQuestions.find(
      (q) => q.textOne?.split("/")[0].trim() === row.text,
    );

    if (!question || !question.textOne) return acc;

    const answers: Record<string, boolean> = {};

    // Split the textOne field by '/' and use the values after the first entry (row name)
    const answerValues = question.textOne.split("/").slice(1);

    answerValues.forEach((answer, index) => {
      if (!columnQuestions?.[index]) return;

      // Check if the answer is "yes" to set as true, otherwise false
      const value = answer.trim().toLowerCase();
      answers[columnQuestions[index].id] = value === "yes";
    });

    acc[row.id] = answers;
    return acc;
  }, {});

  return {
    title: titleDescription,
    image: getImageUrl(serverQuestions[0]?.path || ""),
    rowQuestions,
    columnQuestions: shuffle(columnQuestions),
    correctAnswers,
  };
};

export default tableCheckBoxesTranspiler;
