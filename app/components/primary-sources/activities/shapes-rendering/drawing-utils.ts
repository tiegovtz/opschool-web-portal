import type {
  CustomPolygon,
  Coordinate,
  Shape2D,
  Shape3D,
  SegmentedShape,
} from "./types";

// Draw a 2D shape
export const draw2DShape = (
  ctx: CanvasRenderingContext2D,
  shape: Shape2D,
  width: number,
  height: number
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  ctx.fillStyle = shape.color;

  switch (shape.type) {
    case "circle":
      ctx.beginPath();
      ctx.arc(centerX, centerY, (width * 0.8) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;

    case "square":
      const squareSize = Math.min(width, height) * 0.8; // Make square 80% of the available space
      ctx.beginPath();
      ctx.rect(
        centerX - squareSize / 2,
        centerY - squareSize / 2,
        squareSize,
        squareSize
      );
      ctx.fill();
      ctx.stroke();
      break;

    case "rectangle":
      const rectWidth = width - 10;
      const rectHeight = height / 2;
      ctx.beginPath();
      ctx.rect(
        centerX - rectWidth / 2,
        centerY - rectHeight / 2,
        rectWidth,
        rectHeight
      );
      ctx.fill();
      ctx.stroke();
      break;

    case "triangle":
      if (shape.variant === "rightangled") {
        // True right-angled triangle
        ctx.fillStyle = shape.color;
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.4, centerY + height * 0.4); // Bottom left vertex
        ctx.lineTo(centerX - width * 0.4, centerY - height * 0.4); // Top left vertex (creating right angle)
        ctx.lineTo(centerX + width * 0.4, centerY + height * 0.4); // Bottom right vertex
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      const triangleHeight = height * 0.8; // Use 80% of available height
      const triangleWidth = width * 0.8; // Use 80% of available width
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - triangleHeight / 2);
      ctx.lineTo(centerX - triangleWidth / 2, centerY + triangleHeight / 2);
      ctx.lineTo(centerX + triangleWidth / 2, centerY + triangleHeight / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case "pentagon":
      drawRegularPolygon(ctx, centerX, centerY, shape.size, 5, shape.color);
      break;

    case "hexagon":
      drawRegularPolygon(ctx, centerX, centerY, shape.size, 6, shape.color);
      break;

    case "star":
      drawStar(
        ctx,
        centerX,
        centerY,
        5,
        shape.size,
        shape.size / 2.5,
        shape.color
      );
      break;

    case "oval":
      const ovalWidth = width * 0.8; // Use 80% of available width
      const ovalHeight = height * 0.5; // Use 50% of available height
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        ovalWidth / 2,
        ovalHeight / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      break;
  }
};

// Draw polygon from coordinates
export const drawPolygon = (
  ctx: CanvasRenderingContext2D,
  shape: CustomPolygon,
  width: number,
  height: number
) => {
  const { coordinates, color } = shape;

  if (!coordinates.length) return;
  const [firstPoint] = coordinates;
  if (!firstPoint) return;

  ctx.fillStyle = color;
  ctx.beginPath();

  // Start from the first point
  ctx.moveTo(firstPoint.x * width, firstPoint.y * height);

  // Draw lines to all other points
  for (let i = 1; i < coordinates.length; i++) {
    const point = coordinates[i];
    if (!point) continue;
    ctx.lineTo(point.x * width, point.y * height);
  }

  // Close the path back to the first point
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

// Draw segmented shapes
export const drawSegmentedShape = (
  ctx: CanvasRenderingContext2D,
  shape: SegmentedShape,
  width: number,
  height: number
) => {
  const centerX = width / 2;
  const centerY = height / 2;

  switch (shape.type) {
    case "segmented-circle":
      drawSegmentedCircle(
        ctx,
        centerX,
        centerY,
        (width * 0.8) / 2, // Use 80% of width for radius
        shape.segments,
        shape.highlightedSegments,
        shape.mainColor,
        shape.highlightColor
      );
      break;

    case "segmented-rectangle":
      drawSegmentedRectangle(
        ctx,
        centerX,
        centerY,
        shape.size || 180,
        shape.segments,
        shape.highlightedSegments,
        shape.mainColor,
        shape.highlightColor
      );
      break;

    case "segmented-polygon":
      if (shape.coordinates && shape.segmentCoordinates) {
        // Draw main polygon
        ctx.fillStyle = shape.mainColor;
        ctx.beginPath();
        drawPolygonPath(ctx, shape.coordinates, 0, 0, width);
        ctx.fill();
        ctx.stroke();

        // Draw segment with dotted outline
        ctx.fillStyle = shape.highlightColor;
        ctx.beginPath();
        drawPolygonPath(ctx, shape.segmentCoordinates, 0, 0, width);
        ctx.fill();
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Draw regular polygon with segments
        drawRegularPolygonWithSegments(
          ctx,
          centerX,
          centerY,
          shape.size || 80,
          shape.segments,
          shape.highlightedSegments,
          shape.mainColor,
          shape.highlightColor
        );
      }
      break;
  }
};

// Draw 3D shape using isometric-like projection
export const draw3DShape = (
  ctx: CanvasRenderingContext2D,
  shape: Shape3D,
  width: number,
  height: number
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  ctx.fillStyle = shape.color;

  switch (shape.type) {
    case "sphere":
      // For a sphere, we'll draw a circle with some shading
      ctx.beginPath();
      ctx.arc(centerX, centerY, shape.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Add highlight for 3D effect
      const gradientSphere = ctx.createRadialGradient(
        centerX - shape.size / 3,
        centerY - shape.size / 3,
        0,
        centerX,
        centerY,
        shape.size
      );
      gradientSphere.addColorStop(0, "rgba(255,255,255,0.8)");
      gradientSphere.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradientSphere;
      ctx.beginPath();
      ctx.arc(centerX, centerY, shape.size, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "cube":
      const size = shape.size;
      const offset = size / 4;

      ctx.fillStyle = shape.color;
      ctx.beginPath();
      ctx.rect(centerX - size / 2, centerY - size / 2, size, size);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = lightenColor(shape.color, 30);
      ctx.beginPath();
      ctx.moveTo(centerX - size / 2, centerY - size / 2);
      ctx.lineTo(centerX + size / 2, centerY - size / 2);
      ctx.lineTo(centerX + size / 2 + offset, centerY - size / 2 - offset);
      ctx.lineTo(centerX - size / 2 + offset, centerY - size / 2 - offset);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right face (rhombus)
      ctx.fillStyle = darkenColor(shape.color, 20);
      ctx.beginPath();
      ctx.moveTo(centerX + size / 2, centerY - size / 2);
      ctx.lineTo(centerX + size / 2, centerY + size / 2);
      ctx.lineTo(centerX + size / 2 + offset, centerY + size / 2 - offset);
      ctx.lineTo(centerX + size / 2 + offset, centerY - size / 2 - offset);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case "cylinder":
      const radius = shape.size / 2;
      const height = shape.size * 1.5;

      // Draw top ellipse
      ctx.fillStyle = lightenColor(shape.color, 20);
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY - height / 2,
        radius,
        radius / 3,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();

      // Draw body rectangle
      ctx.fillStyle = shape.color;
      ctx.beginPath();
      ctx.rect(centerX - radius, centerY - height / 2, radius * 2, height);
      ctx.fill();
      ctx.stroke();

      // Draw base (ellipse)
      ctx.fillStyle = darkenColor(shape.color, 20);
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + height / 2,
        radius,
        radius / 3,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      break;

    case "cone":
      const coneRadius = shape.size;
      const coneHeight = shape.size * 1.5;

      // Draw cone body (triangle)
      ctx.fillStyle = shape.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - coneHeight / 2);
      ctx.lineTo(centerX - coneRadius, centerY + coneHeight / 2);
      ctx.lineTo(centerX + coneRadius, centerY + coneHeight / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw base (ellipse)
      ctx.fillStyle = darkenColor(shape.color, 20);
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + coneHeight / 2,
        coneRadius,
        coneRadius / 3,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      break;

    case "pyramid":
      const pyramidSize = shape.size;
      const pyramidHeight = shape.size * 1.2;
      const offset2 = pyramidSize / 5;

      // Base square with offset for 3D effect
      ctx.fillStyle = darkenColor(shape.color, 20);
      ctx.beginPath();
      ctx.moveTo(centerX - pyramidSize / 2, centerY + pyramidHeight / 2);
      ctx.lineTo(centerX + pyramidSize / 2, centerY + pyramidHeight / 2);
      ctx.lineTo(
        centerX + pyramidSize / 2 + offset2,
        centerY + pyramidHeight / 2 - offset2
      );
      ctx.lineTo(
        centerX - pyramidSize / 2 + offset2,
        centerY + pyramidHeight / 2 - offset2
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Front triangle
      ctx.fillStyle = shape.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - pyramidHeight / 2);
      ctx.lineTo(centerX - pyramidSize / 2, centerY + pyramidHeight / 2);
      ctx.lineTo(centerX + pyramidSize / 2, centerY + pyramidHeight / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side triangle
      ctx.fillStyle = lightenColor(shape.color, 15);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - pyramidHeight / 2);
      ctx.lineTo(centerX + pyramidSize / 2, centerY + pyramidHeight / 2);
      ctx.lineTo(
        centerX + pyramidSize / 2 + offset2,
        centerY + pyramidHeight / 2 - offset2
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case "prism":
      const prismWidth = shape.size * 1.5;
      const prismHeight = shape.size;
      const prismDepth = shape.size / 2;

      // Front face (rectangle)
      ctx.fillStyle = shape.color;
      ctx.beginPath();
      ctx.rect(
        centerX - prismWidth / 2,
        centerY - prismHeight / 2,
        prismWidth,
        prismHeight
      );
      ctx.fill();
      ctx.stroke();

      // Top face
      ctx.fillStyle = lightenColor(shape.color, 30);
      ctx.beginPath();
      ctx.moveTo(centerX - prismWidth / 2, centerY - prismHeight / 2);
      ctx.lineTo(centerX + prismWidth / 2, centerY - prismHeight / 2);
      ctx.lineTo(
        centerX + prismWidth / 2 + prismDepth,
        centerY - prismHeight / 2 - prismDepth / 2
      );
      ctx.lineTo(
        centerX - prismWidth / 2 + prismDepth,
        centerY - prismHeight / 2 - prismDepth / 2
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right face
      ctx.fillStyle = darkenColor(shape.color, 20);
      ctx.beginPath();
      ctx.moveTo(centerX + prismWidth / 2, centerY - prismHeight / 2);
      ctx.lineTo(centerX + prismWidth / 2, centerY + prismHeight / 2);
      ctx.lineTo(
        centerX + prismWidth / 2 + prismDepth,
        centerY + prismHeight / 2 - prismDepth / 2
      );
      ctx.lineTo(
        centerX + prismWidth / 2 + prismDepth,
        centerY - prismHeight / 2 - prismDepth / 2
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }
};

// Draw a segmented circle (like a pie chart)
export const drawSegmentedCircle = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  segments: number,
  highlightedSegments: number,
  mainColor: string,
  highlightColor: string
) => {
  const anglePerSegment = (Math.PI * 2) / segments;

  // Draw the main circle first
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw the highlighted segments
  ctx.fillStyle = highlightColor;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, 0, anglePerSegment * highlightedSegments);
  ctx.closePath();
  ctx.fill();
  // Use dotted line for highlighted segment outline
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw segment divider lines with dotted style
  ctx.setLineDash([5, 5]); // Set dotted line pattern
  ctx.beginPath();
  for (let i = 0; i < segments; i++) {
    const angle = i * anglePerSegment;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash to solid
};

// Draw a segmented rectangle
export const drawSegmentedRectangle = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  segments: number,
  highlightedSegments: number,
  mainColor: string,
  highlightColor: string
) => {
  const rectWidth = size * 1.5;
  const rectHeight = size;
  const segmentWidth = rectWidth / segments;

  // Draw the main rectangle first
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.rect(
    centerX - rectWidth / 2,
    centerY - rectHeight / 2,
    rectWidth,
    rectHeight
  );
  ctx.fill();
  ctx.stroke();

  // Draw the highlighted segments
  if (highlightedSegments > 0) {
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.rect(
      centerX - rectWidth / 2,
      centerY - rectHeight / 2,
      segmentWidth * highlightedSegments,
      rectHeight
    );
    ctx.fill();
    // Use dotted line for highlighted segment outline
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw segment divider lines (vertical lines from top to bottom) with dotted style
  ctx.strokeStyle = ctx.strokeStyle || "#000";
  ctx.setLineDash([5, 5]); // Set dotted line pattern
  ctx.beginPath();
  for (let i = 1; i < segments; i++) {
    const x = centerX - rectWidth / 2 + segmentWidth * i;
    // Draw vertical line from top to bottom
    ctx.moveTo(x, centerY - rectHeight / 2);
    ctx.lineTo(x, centerY + rectHeight / 2);
  }
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash to solid
};

// Draw regular polygon helper
export const drawRegularPolygon = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  sides: number,
  color: string
) => {
  ctx.fillStyle = color;
  ctx.beginPath();

  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

// Draw a regular polygon with segments
export const drawRegularPolygonWithSegments = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  sides: number,
  highlightedSegments: number,
  mainColor: string,
  highlightColor: string
) => {
  // Draw the main polygon
  drawRegularPolygon(ctx, centerX, centerY, radius, sides, mainColor);

  // Draw highlighted segments as individual triangular sections
  if (highlightedSegments > 0) {
    ctx.fillStyle = highlightColor;

    for (let i = 0; i < highlightedSegments && i < sides; i++) {
      ctx.beginPath();

      // Start at center
      ctx.moveTo(centerX, centerY);

      // Draw to first vertex of this segment
      const angle1 = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      ctx.lineTo(x1, y1);

      // Draw to second vertex of this segment
      const angle2 = ((i + 1) * 2 * Math.PI) / sides - Math.PI / 2;
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      ctx.lineTo(x2, y2);

      // Close back to center
      ctx.closePath();
      ctx.fill();
      // Use dotted line for highlighted segment outline
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Draw all segment divider lines from center to vertices with dotted style
  ctx.strokeStyle = ctx.strokeStyle || "#000";
  ctx.setLineDash([5, 5]); // Set dotted line pattern
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash to solid
};

// Draw star helper
export const drawStar = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  points: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) => {
  ctx.fillStyle = color;
  ctx.beginPath();

  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

// Helper function to draw a polygon path from coordinates
export const drawPolygonPath = (
  ctx: CanvasRenderingContext2D,
  coordinates: Coordinate[],
  centerX: number,
  centerY: number,
  multiplier: number
) => {
  if (!coordinates.length) return;
  const [firstPoint] = coordinates;
  if (!firstPoint) return;

  // Start from the first point
  ctx.moveTo(firstPoint.x * multiplier, firstPoint.y * multiplier);

  // Draw lines to all other points
  for (let i = 1; i < coordinates.length; i++) {
    const point = coordinates[i];
    if (!point) continue;
    ctx.lineTo(point.x * multiplier, point.y * multiplier);
  }

  // Close the path
  ctx.closePath();
};

// Helper function to lighten a color
export const lightenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
};

// Helper function to darken a color
export const darkenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00ff) - amt;
  const B = (num & 0x0000ff) - amt;

  return `#${(
    0x1000000 +
    (R > 0 ? (R < 255 ? R : 255) : 0) * 0x10000 +
    (G > 0 ? (G < 255 ? G : 255) : 0) * 0x100 +
    (B > 0 ? (B < 255 ? B : 255) : 0)
  )
    .toString(16)
    .slice(1)}`;
};
