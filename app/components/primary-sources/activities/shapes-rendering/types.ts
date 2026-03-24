// Shape types for the shapes rendering activity
export type Coordinate = {
  x: number;
  y: number;
};

export type Shape2DVariant = "rightangled";

export type Shape2D = {
  type:
    | "circle"
    | "triangle"
    | "square"
    | "rectangle"
    | "pentagon"
    | "hexagon"
    | "star"
    | "oval";
  color: string;
  size: number;
  label?: string;
  variant?: Shape2DVariant;
};

export type Shape3D = {
  type: "sphere" | "cube" | "cylinder" | "cone" | "pyramid" | "prism";
  color: string;
  size: number;
  label?: string;
};

export type CustomPolygon = {
  type: "polygon";
  coordinates: Coordinate[];
  color: string;
  label?: string;
  multiplier?: number;
};

export type SegmentedShape = {
  type: "segmented-circle" | "segmented-rectangle" | "segmented-polygon";
  segments: number;
  mainColor: string;
  highlightColor: string;
  highlightedSegments: number;
  label?: string;
  coordinates?: Coordinate[];
  segmentCoordinates?: Coordinate[];
  size?: number;
};

export type ShapeQuestion = {
  id: number;
  shape: Shape2D | Shape3D | CustomPolygon | SegmentedShape;
  options?: string[];
  answer: string;
};

export type ShapesData = {
  title: string;
  questions: ShapeQuestion[];
};
