// @ts-nocheck
import { getRandomItems, shuffle } from "@/lib/utils";
import type { GameObject } from "@/hooks/useObjects";
import type { ActivityTranspilerProps } from "..";

interface MissingDefinitionsTranspilerParams {
  objects: GameObject[];
  titleDescription?: string;
}

interface MissingDefinitionsQuestion {
  word: string;
  definition: string;
  options: string[];
}

interface MissingDefinitionsResult {
  title: string;
  questions: MissingDefinitionsQuestion[];
}

const missingDefinitionsGameTranspiler = (
  params: MissingDefinitionsTranspilerParams,
): MissingDefinitionsResult | null => {
  const { objects, titleDescription = "Missing Definitions" } = params;

  // Filter objects that have both name and category (equivalent to textOne and textTwo)
  const validObjects = objects.filter((obj) => obj.name && obj.category);

  // Check if we have at least 10 valid objects
  if (validObjects.length < 10) {
    console.warn(
      "Not enough valid objects for missing definitions game. Need at least 10.",
    );
    return null;
  }

  // Get 10 random objects for questions
  const selectedObjects: GameObject[] = getRandomItems(validObjects, 10);

  // Get remaining objects for incorrect options
  const remainingObjects = validObjects.filter(
    (obj) => !selectedObjects.some((selected) => selected.id === obj.id),
  );

  // Get 5 additional objects for wrong answer options
  const additionalOptions = getRandomItems(
    remainingObjects.length >= 5 ? remainingObjects : validObjects,
    Math.max(5, remainingObjects.length || validObjects.length),
  );

  // Generate questions
  const questions: MissingDefinitionsQuestion[] = selectedObjects.map(
    (obj) => ({
      word: obj.name,
      definition: obj.syllables as string,
      options: shuffle([
        ...shuffle(additionalOptions)
          .map((option) => option.syllables)
          .slice(0, 5),
        obj.syllables,
      ]),
    }),
  );

  return {
    title: titleDescription,
    questions,
  };
};

// Wrapper function for backward compatibility with existing transpiler interface
const missingDefinitionsGameTranspilerWrapper = (
  params: ActivityTranspilerProps,
) => {
  // If this is called from the old system, return a placeholder
  // The component now handles data fetching internally
  const { titleDescription, serverQuestions } = params;
  const firstQuestion = serverQuestions[0];
  const fallbackType = firstQuestion?.textOne || "";
  return {
    title: titleDescription.split("||")[0],
    type: fallbackType,
    isGameMode: true,
    gameTimeLimit: 300, // || serverQuestions[0].textTwo || 120,
    fontSize: titleDescription.split("||")[1] || 20,
    questions: [],
  };
};

export default missingDefinitionsGameTranspilerWrapper;
export { missingDefinitionsGameTranspiler };
