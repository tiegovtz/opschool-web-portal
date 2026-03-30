import { type ActivityTranspilerProps } from ".";
import { getCommonSeparator, getImageUrl, shuffle } from "@/lib/utils";

export const comprehensionJuniorPropsTranspiler = (
  params: ActivityTranspilerProps,
  examMode: boolean = false
) => {
  const {
    titleDescription,
    algorithm,
    serverQuestions,
    setWrongQuestionsFormat,
  } = params;

  let isWrongFormat = false;

  //   Check Of there is textOne and textTwo in all questions
  serverQuestions.forEach((question) => {
    if (!question.textOne || !question.textTwo) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  const activityNotes = titleDescription.split("//");
  const firstQuestion = serverQuestions[0];
  const optionsTitle =
    activityNotes.length > 2
      ? activityNotes[activityNotes.length - 1]?.trim()
      : "Answer options";

  const theQuestions = serverQuestions.map((question) => {
    const separatedAnswers =
      question.textTwo?.split(getCommonSeparator(question.textTwo ?? "")) ?? [];

    return {
      question: question.textOne,
      image: question.path
        ? getImageUrl(question.path)
        : algorithm === "Comprehension junior one"
        ? getImageUrl(serverQuestions[0]?.path || "")
        : "",
      answers:
        algorithm === "Comprehension junior one"
          ? [separatedAnswers[0] ?? ""]
          : separatedAnswers
              .slice(0, (question.textOne?.split("___").length || 1) - 1)
              .map((option) => option),
      acceptedAnswers:
        algorithm === "Comprehension junior one" ? separatedAnswers : undefined,
      options: shuffle(
        Array.from(
          new Set(
            algorithm === "Comprehension junior one"
                ? [
                  ...(question.textThree?.split(
                    getCommonSeparator(question.textThree ?? "")
                  ) ?? []),
                ].map((opt) => opt.toLowerCase())
              : question.textTwo
                  ?.split(getCommonSeparator(question.textTwo ?? ""))
                  .map((opt) => opt.toLowerCase())
          )
        ).map((lowerOption) => {
          const originalOption =
            separatedAnswers
              .find((opt) => opt.toLowerCase() === lowerOption) || "";
          return {
            id: lowerOption,
            text:
              algorithm === "Comprehension junior one"
                ? lowerOption
                : originalOption,
          };
        }) || []
      ),
    };
  });

  return {
    title: activityNotes[0],
    algorithm,
    notes:
      algorithm === "Comprehension junior one"
        ? activityNotes[1]
        : `<b style="font-size: 1.4rem">${activityNotes[1]}</b> \n\n ${
            activityNotes[activityNotes.length - 2]
          }
          ${activityNotes[activityNotes.length - 1]}`,
    image:
      algorithm === "Comprehension junior two" &&
      serverQuestions[0]?.path &&
      serverQuestions[0]?.pathTwo &&
      getImageUrl(serverQuestions[0]?.pathTwo || ""),
    optionsTitle,
    useAI: activityNotes[activityNotes.length - 2]?.trim() === "AI",
    questions: examMode ? shuffle(theQuestions) : theQuestions,
  };
};
