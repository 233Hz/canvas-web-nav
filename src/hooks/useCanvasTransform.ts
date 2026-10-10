import { useState, useEffect, useCallback, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { Point } from '../types/canvas';

interface UseCanvasTransformProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useCanvasTransform({ containerRef }: UseCanvasTransformProps) {
  const { viewport, setViewport } = useCanvasStore();
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });
  const viewportStartRef = useRef<Point>({ x: 0, y: 0 });

  // 1. Listen for Space key press/release
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept Space if inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 2. Mouse Wheel Zoom centered on cursor
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Check if pinch-to-zoom (ctrlKey) or normal wheel
      const zoomFactor = e.ctrlKey ? 0.05 : 0.0015;
      const delta = -e.deltaY * zoomFactor;

      setViewport((prev) => {
        const nextZoom = Math.min(Math.max(prev.zoom * (1 + delta), 0.15), 3.0);
        const zoomRatio = nextZoom / prev.zoom;

        const nextX = cursorX - (cursorX - prev.x) * zoomRatio;
        const nextY = cursorY - (cursorY - prev.y) * zoomRatio;

        return { x: nextX, y: nextY, zoom: nextZoom };
      });
    },
    [containerRef, setViewport]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerRef, handleWheel]);

  // 3. Pan start / move / end
  const startPan = useCallback(
    (clientX: number, clientY: number) => {
      setIsPanning(true);
      panStartRef.current = { x: clientX, y: clientY };
      viewportStartRef.current = { x: viewport.x, y: viewport.y };
    },
    [viewport.x, viewport.y]
  );

  const movePan = useCallback(
    (clientX: number, clientY: number) => {
      if (!isPanning) return;
      const dx = clientX - panStartRef.current.x;
      const dy = clientY - panStartRef.current.y;
      setViewport((prev) => ({
        ...prev,
        x: viewportStartRef.current.x + dx,
        y: viewportStartRef.current.y + dy,
      }));
    },
    [isPanning, setViewport]
  );

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Quick zoom controls
  const zoomIn = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.25, 3.0),
    }));
  }, [setViewport]);

  const zoomOut = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.25, 0.15),
    }));
  }, [setViewport]);

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1.0 });
  }, [setViewport]);

  return {
    isSpacePressed,
    isPanning,
    startPan,
    movePan,
    endPan,
    zoomIn,
    zoomOut,
    resetView,
  };
}
