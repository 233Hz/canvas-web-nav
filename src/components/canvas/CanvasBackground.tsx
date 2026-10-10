import React from 'react';
import { Viewport } from '../../types/canvas';

interface CanvasBackgroundProps {
  viewport: Viewport;
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ viewport }) => {
  const gridSize = 24 * viewport.zoom;
  const offsetX = viewport.x % gridSize;
  const offsetY = viewport.y % gridSize;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.22) 1.2px, transparent 1.2px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    />
  );
};
