import { useCallback } from "react";
import { useRunStore } from "@/store/useRunStore";

export function useChartHover(data: Record<string, any>[], xKey: string) {
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

  const hoveredX =
    hoveredIndex != null && hoveredIndex >= 0 && hoveredIndex < data.length
      ? data[hoveredIndex][xKey]
      : null;

  return { hoveredIndex, hoveredX, onMouseMove, onMouseLeave };
}
