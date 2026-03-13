/**
 * Reusable SVG gradient and glow filter components for Recharts AreaCharts.
 * Place inside a <defs> block within each chart.
 */

type DefProps = { id: string; color: string };

/** Vertical linear gradient that fades from semi-opaque to near-transparent. */
export function NeonGradient({ id, color }: DefProps) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={color} stopOpacity={0.35} />
      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
    </linearGradient>
  );
}

/** SVG filter that creates a neon glow behind the stroke. */
export function GlowFilter({ id, color }: DefProps) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
      <feFlood floodColor={color} floodOpacity="0.5" result="color" />
      <feComposite in="color" in2="blur" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
