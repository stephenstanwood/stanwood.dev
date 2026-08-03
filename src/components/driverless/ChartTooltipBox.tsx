import type { ReactNode } from "react";

// Shared wrapper for the driverless charts' recharts tooltips so the box
// styling stays consistent across DisengagementChart/GrowthChart/SafetyChart.
export default function ChartTooltipBox({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
      {children}
    </div>
  );
}
