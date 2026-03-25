import { ActivityTranspilerProps } from "./index";

type MagicSquareQuestion = {
  id: number;
  textOne: string; // Format: "4,_,_/_,5,_/2,7,_" (3x3) or "1,_,_,4/_,6,_,_/9,_,_,12/_,_,_,16" (4x4)
  textTwo: string; // Target sum as string
};

const magicSquareTranspiler = ({
  serverQuestions,
  titleDescription,
  algorithm,
  setWrongQuestionsFormat,
}: ActivityTranspilerProps) => {
  try {
    const questions = serverQuestions.map((question) => {
      const magicQuestion = question as unknown as MagicSquareQuestion;

      if (!magicQuestion.textOne || !magicQuestion.textTwo) {
        setWrongQuestionsFormat(true);
        throw new Error("Invalid magic square question format");
      }

      // Parse the grid from textOne (supports 3x3 and 4x4 formats)
      const rows = magicQuestion.textOne.split("/");

      if (rows.length !== 3 && rows.length !== 4) {
        setWrongQuestionsFormat(true);
        throw new Error("Magic square must have exactly 3 or 4 rows");
      }

      const gridSize = rows.length;

      // Validate and parse the grid
      const grid = rows.map((row, rowIndex) => {
        const cells = row.split(",");
        if (cells.length !== gridSize) {
          setWrongQuestionsFormat(true);
          throw new Error(
            `Row ${rowIndex + 1} must have exactly ${gridSize} cells for a ${gridSize}x${gridSize} grid`,
          );
        }
        return cells.map((cell) => cell.trim());
      });

      // Additional validation: ensure grid is truly square
      if (
        grid.length !== gridSize ||
        grid.some((row) => row.length !== gridSize)
      ) {
        setWrongQuestionsFormat(true);
        throw new Error(
          `Invalid grid structure: must be a perfect ${gridSize}x${gridSize} square`,
        );
      }

      // Validate that non-empty cells contain valid numbers
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const cell = grid[i][j];
          if (cell !== "_" && cell !== "") {
            const num = parseFloat(cell);
            if (isNaN(num)) {
              setWrongQuestionsFormat(true);
              throw new Error(
                `Invalid number "${cell}" at position (${i + 1}, ${j + 1})`,
              );
            }
          }
        }
      }

      // Parse target sum from textTwo
      const targetSum = parseInt(magicQuestion.textTwo);
      if (isNaN(targetSum)) {
        setWrongQuestionsFormat(true);
        throw new Error("Invalid target sum");
      }

      return {
        id: magicQuestion.id,
        grid,
        targetSum,
        gridSize,
      };
    });

    return {
      title: titleDescription.split("//")[0],
      notes: "",
      algorithm,
      questions,
    };
  } catch (error) {
    console.error("Error in magic square transpiler:", error);
    setWrongQuestionsFormat(true);
    return {
      title: titleDescription,
      notes: `Error processing magic square data: ${error instanceof Error ? error.message : "Unknown error"}`,
      algorithm,
      questions: [],
    };
  }
};

export default magicSquareTranspiler;
