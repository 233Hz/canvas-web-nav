import React from 'react';
import { MarqueeBox } from '../../types/canvas';
import { useCanvasStore } from '../../store/canvasStore';
import { getMarqueeRect, worldToScreen } from '../../lib/canvasMath';

interface MarqueeSelectionProps {
  marqueeBox: MarqueeBox | null;
}

export const MarqueeSelection: React.FC<MarqueeSelectionProps> = ({ marqueeBox }) => {
  const { viewport } = useCanvasStore();

  if (!marqueeBox) return null;

  const worldRect = getMarqueeRect(marqueeBox);
  if (worldRect.width < 2 && worldRect.height < 2) return null;

  const screenTopLeft = worldToScreen({ x: worldRect.x, y: worldRect.y }, viewport);
  const screenWidth = worldRect.width * viewport.zoom;
  const screenHeight = worldRect.height * viewport.zoom;

  return (
    <div
      className="absolute pointer-events-none z-20 border border-sky-400 bg-sky-500/15 backdrop-blur-[0.5px] rounded-sm transition-none"
      style={{
        left: `${screenTopLeft.x}px`,
        top: `${screenTopLeft.y}px`,
        width: `${screenWidth}px`,
        height: `${screenHeight}px`,
      }}
    />
  );
};
