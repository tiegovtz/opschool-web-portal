import type { ActivityTranspilerProps } from ".";
import { getImageUrl, shuffle } from "@/lib/utils";
import { ActivityType } from "@/lib/types/activity-types";
import type { ServerQuestionType } from "~/types/activity-props";



const imagePathBasedOnQuestion = (
  index: number,
  side: "1" | "2" | "3",
  serverQuestions: ServerQuestionType[]
) => {
  if (side === "1") {
    switch (index) {
      case 0:
        return serverQuestions[0].path;
      case 1:
        return serverQuestions[0].pathTwo;
      case 2:
        return serverQuestions[0].pathThree;
      case 3:
        return serverQuestions[0].pathFour;
      case 4:
        return serverQuestions[2].path;
      case 5:
        return serverQuestions[2].pathTwo;
      default:
        return "";
    }
  } else if (side === "2") {
    switch (index) {
      case 0:
        return serverQuestions[1].path;
      case 1:
        return serverQuestions[1].pathTwo;
      case 2:
        return serverQuestions[1].pathThree;
      case 3:
        return serverQuestions[1].pathFour;
      case 4:
        return serverQuestions[2].pathThree;
      case 5:
        return serverQuestions[2].pathFour;
      default:
        return "";
    }
  } else {
    switch (index) {
      case 0:
        return serverQuestions[2].path;
      case 1:
        return serverQuestions[2].pathTwo;
      case 2:
        return serverQuestions[2].pathThree;
      case 3:
        return serverQuestions[2].pathFour;
      case 4:
        return serverQuestions[2].path;
      case 5:
        return serverQuestions[2].pathTwo;
      default:
        return "";
    }
  }
};

export const inWhichBoxPropsTranspiler = (params: ActivityTranspilerProps) => {
  const { titleDescription, algorithm, serverQuestions } = params;
  let isWrongFormat = false;

  //   Check if all questions have the correct format
  //   Take the first question and check if textOne and textTwo are not null
  const question = serverQuestions[0];
  if (
    algorithm.includes("Six Items") &&
    (question.textOne?.split(",").length !== 8 ||
      question.textTwo?.split(",").length !== 8)
  )
    isWrongFormat = true;

  if (isWrongFormat) {
    params.setWrongQuestionsFormat(true);
    return null;
  }

  const textOneQuestions = shuffle(
    (
      question[
        algorithm === "In Which Box Two Boxes" ? "textTwo" : "textOne"
      ]?.split(algorithm === "In Which Box Two Boxes" ? "/" : ",") || []
    )
      .slice(
        0,
        algorithm.includes("Six Items") ||
          algorithm === "In Which Box Two Boxes"
          ? 6
          : 4
      )
      .map((content, i) => ({
        id: Math.random().toString(36).substring(7),
        content:
          algorithm.toLowerCase().includes("mixed") ||
          algorithm.toLowerCase().includes("pics")
            ? {
                imageSrc: getImageUrl(
                  imagePathBasedOnQuestion(i, "1", serverQuestions) || undefined
                ),
                title: algorithm.toLowerCase().includes("mixed") && content,
              }
            : content,
        answer: "1",
      })) || []
  );

  const textTwoQuestions = shuffle(
    (
      (algorithm === "In Which Box Two Boxes"
        ? serverQuestions[1].textTwo
        : question.textTwo
      )?.split(algorithm === "In Which Box Two Boxes" ? "/" : ",") || []
    )
      .slice(
        0,
        algorithm.includes("Six Items") ||
          algorithm === "In Which Box Two Boxes"
          ? 6
          : 4
      )
      .map((content, i) => ({
        id: Math.random().toString(36).substring(7),
        content:
          algorithm.toLowerCase().includes("mixed") ||
          algorithm.toLowerCase().includes("pics")
            ? {
                imageSrc: getImageUrl(
                  imagePathBasedOnQuestion(i, "2", serverQuestions) || undefined
                ),
                title: algorithm.toLowerCase().includes("mixed") && content,
              }
            : content,
        answer: "2",
      })) || []
  );

  const questions = shuffle([...textOneQuestions, ...textTwoQuestions]);

  return {
    title: titleDescription,
    // category: "text",
    category:
      algorithm.toLowerCase().includes("mixed") ||
      algorithm.toLowerCase().includes("pics")
        ? "image"
        : "text",
    firstOption: {
      id: "1",
      title:
        algorithm === "In Which Box Two Boxes"
          ? question.textOne
          : question.textOne?.split(",")[
              algorithm.includes("Six Items") ? 6 : 4
            ] || "",
      noOfAnswers: textOneQuestions.length,
    },
    secondOption: {
      id: "2",
      title:
        algorithm === "In Which Box Two Boxes"
          ? serverQuestions[1].textOne
          : question.textTwo?.split(",")[
              algorithm.includes("Six Items") ? 6 : 4
            ] || "",
      noOfAnswers: textTwoQuestions.length,
    },
    questions,
  };
};

export const inWhichBoxThreeBoxesPropsTranspiler = (params: {
  titleDescription: string;
  algorithm: ActivityType;
  serverQuestions: ServerQuestionType[];
  setWrongQuestionsFormat: (value: boolean) => void;
}) => {
  const { titleDescription, algorithm, serverQuestions } = params;
  let textOneQuestions,
    textTwoQuestions,
    textThreeQuestions = [];
  let isWrongFormat = false;
  const question = serverQuestions[0];

  if (
    algorithm.toLowerCase().includes("mixed") ||
    algorithm.toLowerCase().includes("pics")
  ) {
    if (
      question.textOne?.split(",").length !== 6 ||
      question.textTwo?.split(",").length !== 6 ||
      question.textThree?.split(",").length !== 6
    )
      isWrongFormat = true;

    if (isWrongFormat) {
      params.setWrongQuestionsFormat(true);
      return null;
    }

    textOneQuestions = shuffle(
      (question.textOne?.split(",") || []).slice(0, 4).map((content, i) => ({
        id: Math.random().toString(36).substring(7),
        // content,
        content: {
          imageSrc: getImageUrl(
            imagePathBasedOnQuestion(i, "1", serverQuestions) || undefined
          ),
          title: algorithm.toLowerCase().includes("mixed") && content,
        },
        answer: "1",
      })) || []
    );

    textTwoQuestions = shuffle(
      (question.textTwo?.split(",") || []).slice(0, 4).map((content, i) => ({
        id: Math.random().toString(36).substring(7),
        // content,
        content: {
          imageSrc: getImageUrl(
            imagePathBasedOnQuestion(i, "2", serverQuestions) || undefined
          ),
          title: algorithm.toLowerCase().includes("mixed") && content,
        },
        answer: "2",
      })) || []
    );

    textThreeQuestions = shuffle(
      (question.textThree?.split(",") || []).slice(0, 4).map((content, i) => ({
        id: Math.random().toString(36).substring(7),
        // content,
        content: {
          imageSrc: getImageUrl(
            imagePathBasedOnQuestion(i, "3", serverQuestions) || undefined
          ),
          title: algorithm.toLowerCase().includes("mixed") && content,
        },
        answer: "3",
      })) || []
    );
  } else {
    if (serverQuestions.length !== 3) isWrongFormat = true;

    if (isWrongFormat) {
      params.setWrongQuestionsFormat(true);
      return null;
    }

    textOneQuestions = shuffle(
      (serverQuestions[0].textTwo?.split("/") || [])
        .slice(0, 6)
        .map((content, i) => ({
          id: content.toLowerCase(),
          content,
          answer: "1",
        })) || []
    );

    textTwoQuestions = shuffle(
      (serverQuestions[1].textTwo?.split("/") || [])
        .slice(0, 6)
        .map((content, i) => ({
          id: content.toLowerCase(),
          content,
          answer: "2",
        })) || []
    );

    textThreeQuestions = shuffle(
      (serverQuestions[2].textTwo?.split("/") || [])
        .slice(0, 6)
        .map((content, i) => ({
          id: content.toLowerCase(),
          content,
          answer: "3",
        })) || []
    );
  }

  const questions = shuffle([
    ...textOneQuestions,
    ...textTwoQuestions,
    ...textThreeQuestions,
  ]);

  return {
    title: titleDescription,
    // category: "text",
    category:
      algorithm.toLowerCase().includes("mixed") ||
      algorithm.toLowerCase().includes("pics")
        ? "image"
        : "text",
    firstOption: {
      id: "1",
      title:
        algorithm.toLowerCase() === "in which box"
          ? serverQuestions[0].textOne
          : question.textOne?.split(",")[4] || "",
      noOfAnswers: textOneQuestions.length,
    },
    secondOption: {
      id: "2",
      title:
        algorithm.toLowerCase() === "in which box"
          ? serverQuestions[1].textOne
          : question.textTwo?.split(",")[4] || "",
      noOfAnswers: textTwoQuestions.length,
    },
    thirdOption: {
      id: "3",
      title:
        algorithm.toLowerCase() === "in which box"
          ? serverQuestions[2].textOne
          : question.textThree?.split(",")[4] || "",
      noOfAnswers: textThreeQuestions.length,
    },
    questions,
  };
};
