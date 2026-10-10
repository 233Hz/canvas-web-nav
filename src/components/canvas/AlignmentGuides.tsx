import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { worldToScreen } from '../../lib/canvasMath';

export const AlignmentGuides: React.FC = () => {
  const { activeGuides, viewport } = useCanvasStore();

  if (activeGuides.length === 0) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible">
      {activeGuides.map((guide) => {
        if (guide.orientation === 'vertical') {
          const screenX = worldToScreen({ x: guide.position, y: 0 }, viewport).x;
          const isCenter = guide.type === 'center-x';
          const isGrid = guide.type === 'grid-x';

          return (
            <g key={guide.id}>
              <line
                x1={screenX}
                y1={0}
                x2={screenX}
                y2="100%"
                stroke={isGrid ? '#64748b' : isCenter ? '#a855f7' : '#38bdf8'}
                strokeWidth={isGrid ? 1 : 1.5}
                strokeDasharray={isGrid ? '3 3' : isCenter ? '4 3' : undefined}
                className="opacity-80"
              />
              {!isGrid && (
                <circle
                  cx={screenX}
                  cy={14}
                  r={3}
                  fill={isCenter ? '#a855f7' : '#38bdf8'}
                />
              )}
            </g>
          );
        } else {
          const screenY = worldToScreen({ x: 0, y: guide.position }, viewport).y;
          const isCenter = guide.type === 'center-y';
          const isGrid = guide.type === 'grid-y';

          return (
            <g key={guide.id}>
              <line
                x1={0}
                y1={screenY}
                x2="100%"
                y2={screenY}
                stroke={isGrid ? '#64748b' : isCenter ? '#a855f7' : '#38bdf8'}
                strokeWidth={isGrid ? 1 : 1.5}
                strokeDasharray={isGrid ? '3 3' : isCenter ? '4 3' : undefined}
                className="opacity-80"
              />
              {!isGrid && (
                <circle
                  cx={14}
                  cy={screenY}
                  r={3}
                  fill={isCenter ? '#a855f7' : '#38bdf8'}
                />
              )}
            </g>
          );
        }
      })}
    </svg>
  );
};
