import { ActivityTranspilerProps } from ".";

export const NumberMatrixTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, titleDescription, setWrongQuestionsFormat } = params;
  let isWrongFormat = false;

  // Basic validation of the format
  serverQuestions.forEach((item) => {
    if (!item.textOne || !item.textOne.includes(",")) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription,
    questions: serverQuestions.map((item) => {
      // Parse the comma-separated sequence
      const sequenceItems =
        item.textOne?.split(",").map((item) => item.trim()) || [];

      // Process each item in the sequence
      const sequence: (number | string)[] = [];
      const patternIndices: number[] = [];
      const correctAnswers: number[] = [];

      sequenceItems.forEach((seqItem, index) => {
        if (seqItem.includes("/")) {
          // This is a pattern item like "1/1" or "10/10"
          sequence.push(seqItem); // Keep the original pattern for display
          patternIndices.push(index);

          // Extract the correct answer (the number itself)
          const numberPart = seqItem.split("/")[0];
          correctAnswers.push(parseInt(numberPart, 10));
        } else {
          // Regular number
          sequence.push(parseInt(seqItem, 10));
        }
      });

      return {
        id: item.id,
        sequence,
        patternIndices,
        correctAnswers,
      };
    }),
  };
};

export default NumberMatrixTranspiler;
