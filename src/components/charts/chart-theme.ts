/** Shared chart configuration constants for the HUD neon aesthetic. */

// Neon colors
export const NEON_GREEN = "#00ffaa";
export const NEON_CYAN = "#00ccff";
export const NEON_PURPLE = "#b388ff";
export const NEON_AMBER = "#ffab40";

// Chart layout
export const CHART_MARGINS = { top: 4, right: 8, bottom: 0, left: 0 };

// Axis styling — muted labels, near-invisible axis lines
export const AXIS_STYLE = {
  tick: { fill: "rgba(224,224,224,0.35)", fontSize: 10 },
  axisLine: { stroke: "rgba(255,255,255,0.06)" },
  tickLine: false as const,
};

// Grid — faint horizontal dashes
export const GRID_STYLE = {
  strokeDasharray: "3 3",
  stroke: "rgba(255,255,255,0.04)",
  vertical: false as const,
};

// Tooltip — dark glass panel
export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(10,10,15,0.92)",
    border: "1px solid rgba(0,255,170,0.15)",
    borderRadius: 4,
    fontSize: 12,
    color: "#e0e0e0",
  },
};
