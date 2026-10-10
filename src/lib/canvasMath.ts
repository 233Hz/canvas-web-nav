import { Point, Rect, Viewport, AlignmentGuide, SnapResult, MarqueeBox } from '../types/canvas';

/**
 * Convert screen (pixel) coordinate to canvas world coordinate
 */
export function screenToWorld(screen: Point, viewport: Viewport): Point {
  return {
    x: (screen.x - viewport.x) / viewport.zoom,
    y: (screen.y - viewport.y) / viewport.zoom,
  };
}

/**
 * Convert canvas world coordinate to screen (pixel) coordinate
 */
export function worldToScreen(world: Point, viewport: Viewport): Point {
  return {
    x: world.x * viewport.zoom + viewport.x,
    y: world.y * viewport.zoom + viewport.y,
  };
}

/**
 * Convert MarqueeBox (drag start & current points in world space) to a normalized Rect
 */
export function getMarqueeRect(box: MarqueeBox): Rect {
  const x = Math.min(box.startX, box.currentX);
  const y = Math.min(box.startY, box.currentY);
  const width = Math.abs(box.currentX - box.startX);
  const height = Math.abs(box.currentY - box.startY);
  return { x, y, width, height };
}

/**
 * Check if two axis-aligned rectangles intersect
 */
export function rectsIntersect(r1: Rect, r2: Rect): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

/**
 * Calculate edge, center, and grid snapping with guide lines
 */
export function calculateSnapping(
  activeRect: Rect,
  otherRects: Rect[],
  options: {
    gridSnapping: boolean;
    gridSize?: number;
    threshold?: number; // in world units
  }
): SnapResult {
  const { gridSnapping, gridSize = 20, threshold = 6 } = options;
  let snappedX = activeRect.x;
  let snappedY = activeRect.y;
  const guides: AlignmentGuide[] = [];

  // Active rect boundaries and centers
  const aLeft = activeRect.x;
  const aRight = activeRect.x + activeRect.width;
  const aCenterX = activeRect.x + activeRect.width / 2;

  const aTop = activeRect.y;
  const aBottom = activeRect.y + activeRect.height;
  const aCenterY = activeRect.y + activeRect.height / 2;

  let minDeltaX = threshold + 1;
  let snapTargetX: { val: number; guide: AlignmentGuide } | null = null;

  let minDeltaY = threshold + 1;
  let snapTargetY: { val: number; guide: AlignmentGuide } | null = null;

  // 1. Compare with other blocks (Edge and Center alignment)
  for (const target of otherRects) {
    const tLeft = target.x;
    const tRight = target.x + target.width;
    const tCenterX = target.x + target.width / 2;

    const tTop = target.y;
    const tBottom = target.y + target.height;
    const tCenterY = target.y + target.height / 2;

    // --- X Axis Alignment checks ---
    // Left to Left
    if (Math.abs(aLeft - tLeft) < minDeltaX) {
      minDeltaX = Math.abs(aLeft - tLeft);
      snapTargetX = {
        val: tLeft,
        guide: {
          id: `x-l-l-${tLeft}`,
          type: 'edge-x',
          orientation: 'vertical',
          position: tLeft,
          start: Math.min(aTop, tTop) - 20,
          end: Math.max(aBottom, tBottom) + 20,
        },
      };
    }
    // Right to Right
    if (Math.abs(aRight - tRight) < minDeltaX) {
      minDeltaX = Math.abs(aRight - tRight);
      snapTargetX = {
        val: tRight - activeRect.width,
        guide: {
          id: `x-r-r-${tRight}`,
          type: 'edge-x',
          orientation: 'vertical',
          position: tRight,
          start: Math.min(aTop, tTop) - 20,
          end: Math.max(aBottom, tBottom) + 20,
        },
      };
    }
    // Left to Right
    if (Math.abs(aLeft - tRight) < minDeltaX) {
      minDeltaX = Math.abs(aLeft - tRight);
      snapTargetX = {
        val: tRight,
        guide: {
          id: `x-l-r-${tRight}`,
          type: 'edge-x',
          orientation: 'vertical',
          position: tRight,
          start: Math.min(aTop, tTop) - 20,
          end: Math.max(aBottom, tBottom) + 20,
        },
      };
    }
    // Right to Left
    if (Math.abs(aRight - tLeft) < minDeltaX) {
      minDeltaX = Math.abs(aRight - tLeft);
      snapTargetX = {
        val: tLeft - activeRect.width,
        guide: {
          id: `x-r-l-${tLeft}`,
          type: 'edge-x',
          orientation: 'vertical',
          position: tLeft,
          start: Math.min(aTop, tTop) - 20,
          end: Math.max(aBottom, tBottom) + 20,
        },
      };
    }
    // Center X to Center X
    if (Math.abs(aCenterX - tCenterX) < minDeltaX) {
      minDeltaX = Math.abs(aCenterX - tCenterX);
      snapTargetX = {
        val: tCenterX - activeRect.width / 2,
        guide: {
          id: `x-c-c-${tCenterX}`,
          type: 'center-x',
          orientation: 'vertical',
          position: tCenterX,
          start: Math.min(aTop, tTop) - 20,
          end: Math.max(aBottom, tBottom) + 20,
        },
      };
    }

    // --- Y Axis Alignment checks ---
    // Top to Top
    if (Math.abs(aTop - tTop) < minDeltaY) {
      minDeltaY = Math.abs(aTop - tTop);
      snapTargetY = {
        val: tTop,
        guide: {
          id: `y-t-t-${tTop}`,
          type: 'edge-y',
          orientation: 'horizontal',
          position: tTop,
          start: Math.min(aLeft, tLeft) - 20,
          end: Math.max(aRight, tRight) + 20,
        },
      };
    }
    // Bottom to Bottom
    if (Math.abs(aBottom - tBottom) < minDeltaY) {
      minDeltaY = Math.abs(aBottom - tBottom);
      snapTargetY = {
        val: tBottom - activeRect.height,
        guide: {
          id: `y-b-b-${tBottom}`,
          type: 'edge-y',
          orientation: 'horizontal',
          position: tBottom,
          start: Math.min(aLeft, tLeft) - 20,
          end: Math.max(aRight, tRight) + 20,
        },
      };
    }
    // Top to Bottom
    if (Math.abs(aTop - tBottom) < minDeltaY) {
      minDeltaY = Math.abs(aTop - tBottom);
      snapTargetY = {
        val: tBottom,
        guide: {
          id: `y-t-b-${tBottom}`,
          type: 'edge-y',
          orientation: 'horizontal',
          position: tBottom,
          start: Math.min(aLeft, tLeft) - 20,
          end: Math.max(aRight, tRight) + 20,
        },
      };
    }
    // Bottom to Top
    if (Math.abs(aBottom - tTop) < minDeltaY) {
      minDeltaY = Math.abs(aBottom - tTop);
      snapTargetY = {
        val: tTop - activeRect.height,
        guide: {
          id: `y-b-t-${tTop}`,
          type: 'edge-y',
          orientation: 'horizontal',
          position: tTop,
          start: Math.min(aLeft, tLeft) - 20,
          end: Math.max(aRight, tRight) + 20,
        },
      };
    }
    // Center Y to Center Y
    if (Math.abs(aCenterY - tCenterY) < minDeltaY) {
      minDeltaY = Math.abs(aCenterY - tCenterY);
      snapTargetY = {
        val: tCenterY - activeRect.height / 2,
        guide: {
          id: `y-c-c-${tCenterY}`,
          type: 'center-y',
          orientation: 'horizontal',
          position: tCenterY,
          start: Math.min(aLeft, tLeft) - 20,
          end: Math.max(aRight, tRight) + 20,
        },
      };
    }
  }

  // If a block alignment was found within threshold, apply it
  if (snapTargetX && minDeltaX <= threshold) {
    snappedX = snapTargetX.val;
    guides.push(snapTargetX.guide);
  } else if (gridSnapping) {
    // Otherwise fallback to grid snapping if enabled
    const gridX = Math.round(activeRect.x / gridSize) * gridSize;
    if (Math.abs(gridX - activeRect.x) <= threshold) {
      snappedX = gridX;
      guides.push({
        id: `grid-x-${gridX}`,
        type: 'grid-x',
        orientation: 'vertical',
        position: gridX,
      });
    }
  }

  if (snapTargetY && minDeltaY <= threshold) {
    snappedY = snapTargetY.val;
    guides.push(snapTargetY.guide);
  } else if (gridSnapping) {
    // Otherwise fallback to grid snapping if enabled
    const gridY = Math.round(activeRect.y / gridSize) * gridSize;
    if (Math.abs(gridY - activeRect.y) <= threshold) {
      snappedY = gridY;
      guides.push({
        id: `grid-y-${gridY}`,
        type: 'grid-y',
        orientation: 'horizontal',
        position: gridY,
      });
    }
  }

  return {
    x: snappedX,
    y: snappedY,
    guides,
  };
}
