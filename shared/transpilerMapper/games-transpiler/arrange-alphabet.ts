import type { ActivityTranspilerProps } from "..";

interface ArrangeAlphabetResult {
  title: string;
  type: string | null;
  isGameMode: boolean;
  gameTimeLimit: number;
  fontSize: number;
}

// Wrapper function for transpiler interface
const arrangeAlphabetGameTranspiler = (
  params: ActivityTranspilerProps,
): ArrangeAlphabetResult => {
  const { titleDescription, serverQuestions } = params;

  // Extract type from server questions (textOne field contains the object type)
  const type = serverQuestions[0]?.textOne || null;

  // Extract game time limit from server questions (textTwo field contains time limit)
  const gameTimeLimit = serverQuestions[0]?.textTwo
    ? parseInt(serverQuestions[0].textTwo)
    : 300; // Default 5 minutes

  // Extract font size from title description (format: "title||fontSize")
  const titleParts = titleDescription.split("||");
  const title = titleParts[0] || "Arrange Alphabet";
  const fontSize = titleParts[1] ? parseInt(titleParts[1]) : 20;

  return {
    title,
    type,
    isGameMode: true,
    gameTimeLimit,
    fontSize,
  };
};

export default arrangeAlphabetGameTranspiler;
