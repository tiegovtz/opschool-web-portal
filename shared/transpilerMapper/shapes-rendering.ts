import { ActivityTranspilerProps } from ".";
import { ActivityType } from "@/lib/types/activity-types";
import type {
  Shape2D,
  Coordinate,
  CustomPolygon,
  ShapeQuestion,
  SegmentedShape,
  Shape2DVariant,
} from "@/components/activities/shapes-rendering/types";

const shapesRenderingTranspiler = (params: ActivityTranspilerProps) => {
  const {
    titleDescription,
    // algorithm,
    serverQuestions,
    isMobile,
    // setWrongQuestionsFormat,
  } = params;
  // let isWrongFormat = false;

  const questions = serverQuestions.map((data: any) => {
    const segmentedShape: boolean =
      // Avoiding simple shapes
      ![
        "circle",
        "ellipse",
        "oval",
        "right angle triangle",
        "triangle",
        "square",
      ].includes(data.textOne.toLowerCase()) ||
      // Check for segmented rectangles
      (data.textOne.toLowerCase() === "rectangle" &&
        !isNaN(parseInt(data.textFive.split(",")[6])) &&
        !isNaN(parseInt(data.textFive.split(",")[7]))) ||
      data.textOne.toLowerCase().includes("segmented") ||
      (data.textOne.toLowerCase().includes("polygon") &&
        (data.textFive ||
          data.textFour
            .split(",")
            .filter((item: string) => !isNaN(parseInt(item))).length >= 2));

    if (segmentedShape) {
      if (
        data.textOne.toLowerCase() === "segmented circle" ||
        data.textOne.toLowerCase() === "polygon" ||
        data.textOne.toLowerCase() === "regular polygon" ||
        data.textOne.toLowerCase() === "rectangle"
      )
        return processSegmentedShape(data, isMobile);

      return null;
    }

    return processBasicShape(data);
  });

  return {
    title: titleDescription.split("//")[0] || "Learn about Shapes",
    algorithm: ActivityType.ShapesRendering,
    questions: questions.filter((q) => q !== null) as ShapeQuestion[],
  };
};

// Parse any shape data from the server
// const processShape = (data: any): ShapeQuestion => {};

// Parse basic shapes from the data
const processBasicShape = (data: any): ShapeQuestion => {
  const shapeName = data.textOne.toLowerCase().includes("polygon")
    ? "polygon"
    : data.textOne.toLowerCase();
  const answer = data.textSix.split(",")[0]; // The answer is in textSix before the comma

  // Default shape properties
  let shape: Shape2D | CustomPolygon = {
    type: "circle", // Default type, will be overridden
    color: "tomato",
    size: 80,
  };

  // Process based on shape type
  switch (shapeName) {
    case "circle":
      shape = processCircle(data.textTwo);
      break;
    case "rectangle":
      shape = processRectangle(data.textFive);
      break;
    case "ellipse":
    case "oval":
      shape = processOval(data.textThree);
      break;
    case "right angle triangle":
      shape = processTriangle(data.textEight, "rightangled");
      break;
    case "triangle":
      shape = processTriangle(data.textEight);
      break;
    case "square":
      shape = processSquare(data.textFour);
      break;
    case "polygon":
      shape = processPolygon(data.textTwo);
      break;
    default:
      // For any other shape, use default values
      shape = {
        type: shapeName as any,
        color: "blue",
        size: 80,
      };
  }

  return {
    id: data.id,
    shape,
    answer,
  };
};

// Process segmented shapes
const processSegmentedShape = (
  data: any,
  isMobile?: boolean
): ShapeQuestion => {
  const shapeName = data.textOne.toLowerCase();
  const answer = data.textSix.split(",")[0]; // The answer is in textSix before the comma

  let shape: SegmentedShape = {
    type: "segmented-rectangle", // Default type, will be overridden
    segments: 4,
    mainColor: "white",
    highlightColor: "blue",
    highlightedSegments: 1,
  };

  // Process based on shape type
  if (shapeName.includes("circle")) {
    const params = data.textFour.split(",");
    shape = {
      type: "segmented-circle",
      segments: parseInt(params[0]) || 4,
      mainColor: params[1] || "white",
      highlightedSegments: parseInt(params[2]) || 1,
      highlightColor: params[3] || "yellow",
      size: isMobile ? 40 : 80,
    };
  } else if (shapeName.includes("rectangle")) {
    const params = data.textFive.split(",");
    shape = {
      type: "segmented-rectangle",
      segments: parseInt(params[6]) || 4,
      mainColor: params[4] || "white",
      highlightColor: params[5] || "blue",
      highlightedSegments: parseInt(params[7]) || 1,
      size: isMobile ? 90 : 180,
    };
  } else if (shapeName.toLowerCase() === "regular polygon") {
    const params = data.textFour.split(",");
    shape = {
      type: "segmented-polygon",
      segments: parseInt(params[0]) || 6, // Number of sides for the regular polygon
      mainColor: params[1] || "white",
      highlightedSegments: parseInt(params[2]) || 1,
      highlightColor: params[3] || "purple",
      size: isMobile ? 70 : 100,
    };
  } else if (shapeName.includes("polygon")) {
    // Process main polygon coordinates
    const mainCoords = data.textTwo.split(",").map(parseFloat);
    const secondaryCoords = data.textFive.split(",").map(parseFloat);

    // Create coordinates array for the main polygon
    const coordinates: Coordinate[] = [];
    for (let i = 0; i < mainCoords.length; i += 2) {
      if (!isNaN(mainCoords[i]) && !isNaN(mainCoords[i + 1])) {
        coordinates.push({ x: mainCoords[i], y: mainCoords[i + 1] });
      }
    }

    // Create coordinates array for the secondary polygon (segment)
    const segmentCoordinates: Coordinate[] = [];
    for (let i = 0; i < secondaryCoords.length; i += 2) {
      if (!isNaN(secondaryCoords[i]) && !isNaN(secondaryCoords[i + 1])) {
        segmentCoordinates.push({
          x: secondaryCoords[i],
          y: secondaryCoords[i + 1],
        });
      }
    }

    shape = {
      type: "segmented-polygon",
      segments: 1, // In this case, segments is not really relevant
      mainColor: "white",
      highlightColor: "blue",
      highlightedSegments: 1,
      coordinates,
      // Store segment coordinates as a property
      // @ts-ignore - Adding custom property for segmented polygons
      segmentCoordinates,
    };
  }

  // Create options for multiple choice
  // const options = [
  //   "Half",
  //   "Quarter",
  //   "Third",
  //   "Eighth",
  //   "Sixth",
  //   "Fifth",
  // ].filter((option) => option !== answer);

  // Shuffle and take 3 options, then add the correct answer
  // const shuffledOptions = options.sort(() => Math.random() - 0.5).slice(0, 3);
  // shuffledOptions.push(answer);

  // Shuffle again to randomize the position of the correct answer
  // const finalOptions = shuffledOptions.sort(() => Math.random() - 0.5);

  return {
    id: data.id,
    shape,
    answer:
      shapeName.includes("circle") ||
      shapeName.includes("rectangle") ||
      shapeName.includes("polygon")
        ? `${shape.highlightedSegments}/${shape.segments}`
        : answer,
  };
};

// Helper function to process circle parameters
const processCircle = (params: string): Shape2D => {
  const parts = params.split(",");
  return {
    type: "circle",
    color: parts[6]?.trim() || "tomato",
    size: 1,
  };
};

// Helper function to process rectangle parameters
const processRectangle = (params: string): Shape2D => {
  const parts = params.split(",");
  return {
    type: "rectangle",
    color:
      parts[4]?.trim() && parts[4]?.trim() !== "white"
        ? parts[4]?.trim()
        : "green",
    size: 1,
  };
};

// Helper function to process oval parameters
const processOval = (params: string): Shape2D => {
  const parts = params.split(",");
  return {
    type: "oval",
    color: parts[7]?.trim() || "blue",
    size: 1,
  };
};

// Helper function to process triangle parameters
const processTriangle = (params: string, variant?: Shape2DVariant): Shape2D => {
  const parts = params.split(",");
  return {
    type: "triangle",
    variant,
    color: parts[4]?.trim() || "yellow",
    size: 1,
  };
};

// Helper function to process square parameters
const processSquare = (params: string): Shape2D => {
  const parts = params.split(",");
  return {
    type: "square",
    color: parts[4]?.trim() || "blue",
    size: 1,
  };
};

// Helper function to process polygon parameters
const processPolygon = (params: string): CustomPolygon => {
  const values = params
    .split(",")
    .map((v) => parseFloat(v) || parseInt(v) || 0);
  const coordinates: Coordinate[] = [];

  // Extract coordinates pairs (x,y)
  for (let i = 0; i < values.length; i += 2) {
    if (i + 1 < values.length) {
      coordinates.push({
        x: values[i] * 200 - 100, // Scale and center
        y: values[i + 1] * 200 - 100,
      });
    }
  }

  return {
    type: "polygon",
    coordinates,
    color: "purple", // Default color
    multiplier: 1,
  };
};

export default shapesRenderingTranspiler;
