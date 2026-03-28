import type { ActivityTranspilerProps } from "./index";

// Transpiler for 'Two units operation' activity
export default function twoUnitsOperationTranspiler({
  serverQuestions,
  setWrongQuestionsFormat,
}: ActivityTranspilerProps) {
  try {
    return serverQuestions.map((q) => {
      // textOne: "shs 625445 50 cts + shs 357223 85 cts = ___"
      // textTwo: "shs 982669 35 cts"
      const question = q.textOne || "";
      const answer = q.textTwo || "";

      return {
        id: q.id,
        question,
        answer,
      };
    });
  } catch (e) {
    setWrongQuestionsFormat(true);
    return [];
  }
}
