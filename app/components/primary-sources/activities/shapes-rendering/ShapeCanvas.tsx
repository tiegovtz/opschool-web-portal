"use client";

import React, { useEffect, useRef } from "react";
import { ShapeQuestion, Shape2D, Shape3D, SegmentedShape } from "./types";
import {
  draw2DShape,
  draw3DShape,
  drawPolygon,
  drawSegmentedShape,
} from "./drawing-utils";

type ShapeCanvasProps = {
  question: ShapeQuestion;
  canvasIndex: number;
  width?: number;
  height?: number;
  className?: string;
};

const ShapeCanvas: React.FC<ShapeCanvasProps> = ({
  question,
  canvasIndex,
  width = 200,
  height = 200,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set common styles
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    const shape = question.shape; // Render the appropriate shape based on its type
    if (shape.type === "polygon") {
      drawPolygon(ctx, shape, width, height);
    } else if (shape.type.startsWith("segmented")) {
      drawSegmentedShape(ctx, shape as SegmentedShape, width, height);
    } else if (
      shape.type === "circle" ||
      shape.type === "triangle" ||
      shape.type === "square" ||
      shape.type === "rectangle" ||
      shape.type === "pentagon" ||
      shape.type === "hexagon" ||
      shape.type === "star" ||
      shape.type === "oval"
    ) {
      draw2DShape(ctx, shape as Shape2D, width, height);
    } else {
      draw3DShape(ctx, shape as Shape3D, width, height);
    }
  }, [question, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
};

export default ShapeCanvas;
