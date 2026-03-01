import { useCallback } from "react";
import { useRunStore } from "@/store/useRunStore";

export function useChartHover<T extends Record<string, any>>(
  data: T[],
  xKey: string,
) {
  const hoveredIndex = useRunStore((s) => s.hoveredIndex);
  const setHoveredIndex = useRunStore((s) => s.setHoveredIndex);

  const onMouseMove = useCallback(
    (e: any) => {
      if (e && e.activeTooltipIndex != null) {
        setHoveredIndex(Number(e.activeTooltipIndex));
      }
    },
    [setHoveredIndex],
  );

  const onMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, [setHoveredIndex]);

  const inRange =
    hoveredIndex != null && hoveredIndex >= 0 && hoveredIndex < data.length;

  const hoveredX = inRange ? data[hoveredIndex!][xKey] : null;
  const hoveredPoint = inRange ? data[hoveredIndex!] : null;

  return { hoveredIndex, hoveredX, hoveredPoint, onMouseMove, onMouseLeave };
}
