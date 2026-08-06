import type { ReactNode } from "react";

/**
 * The recharts props a custom `<Tooltip content>` receives. `T` is the shape of
 * the payload entries the chart hands back, which differs per chart.
 */
export interface ChartTooltipProps<T> {
  active?: boolean;
  payload?: T[];
  label?: string;
}

/** Grid/axis stroke shared by the driverless charts. */
export const CHART_GRID_STROKE = "var(--dl-border)";

/** Axis tick styling shared by the driverless charts. */
export const CHART_AXIS_TICK = { fontSize: 11 } as const;

// Shared wrapper for the driverless charts' recharts tooltips so the box
// styling stays consistent across DisengagementChart/GrowthChart/SafetyChart.
export default function ChartTooltipBox({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "var(--dl-card)", border: `1px solid ${CHART_GRID_STROKE}`, borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
      {children}
    </div>
  );
}
