import { getImageUrl } from "@/lib/utils";
import { ActivityTranspilerProps } from "..";

const additionSubtractionObjectsTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const { serverQuestions, setWrongQuestionsFormat, titleDescription } = params;
  let isWrongFormat = false;

  serverQuestions.forEach((question) => {
    if (
      !question.textOne ||
      !question.textTwo ||
      !question.textThree ||
      !question.textFour ||
      !question.textFive ||
      !question.path
    ) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription,
    questions: serverQuestions.map((question) => {
      const leftNumber = parseInt(question.textOne as string);
      const rightNumber = parseInt(question.textTwo as string);
      const operatorSymbol = question.textThree as string; // Display as-is from server
      const displayAnswer = question.textFour as string; // What to display after equals
      const correctAnswer = parseInt(question.textFive as string); // Correct answer for validation

      // Determine operation type for conditional rendering
      const operator = operatorSymbol.toLowerCase().trim();
      const isMultiplicationOrDivision =
        operator === "*" ||
        operator === "×" ||
        operator === "x" ||
        operator === "/" ||
        operator === "÷" ||
        operator === "multiply by" ||
        operator === "divide by";

      return {
        leftNumber,
        rightNumber,
        leftImage: getImageUrl(question.path as string),
        rightImage: question.pathTwo
          ? getImageUrl(question.pathTwo as string)
          : getImageUrl(question.path as string),
        operator: operatorSymbol, // Use the symbol as-is from server
        displayAnswer, // What shows after equals sign
        answer: correctAnswer, // The correct answer for validation
        isMultiplicationOrDivision, // Flag for conditional rendering
      };
    }),
  };
};

export default additionSubtractionObjectsTranspiler;
