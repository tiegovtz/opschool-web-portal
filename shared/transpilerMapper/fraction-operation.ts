import type { ActivityTranspilerProps } from ".";

// Transpiler for 'Fraction operation' activity
export default function fractionOperationTranspiler({
  serverQuestions,
  setWrongQuestionsFormat,
}: ActivityTranspilerProps) {
  try {
    return serverQuestions.map((q) => {
      // textOne: "(3/10) + (5/10) ="
      // textTwo: "(8/10)//(4/5)"
      const question = q.textOne;
      const answers = (q.textTwo || "")
        .split("//")
        .map((ans: string) => ans.trim())
        .filter(Boolean);
      return {
        id: q.id,
        question,
        answers,
      };
    });
  } catch (e) {
    setWrongQuestionsFormat(true);
    return [];
  }
}
