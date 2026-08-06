import type { ReactNode } from "react";

/** The dashboard's monospace stack, as an inline-style value. */
export const DL_MONO = '"JetBrains Mono", monospace';

/** Wrapper for a panel's row of filter pills. */
export function FilterPillRow({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>;
}

interface FilterPillProps {
  active: boolean;
  /** Border colour, and background/badge colour, when selected. */
  color: string;
  /** Background when selected. */
  background: string;
  /** Label colour when selected — white on the solid "All" pill, `color` on the tinted ones. */
  activeInk?: string;
  /** Renders the trailing monospace count badge. Omit for pills that put the count in their label. */
  count?: number;
  onClick: () => void;
  children: ReactNode;
}

/**
 * One filter pill in a driverless panel's filter bar. Shared by CompanyCards
 * and AVTimeline, which filter different data through an identical control.
 */
export default function FilterPill({
  active,
  color,
  background,
  activeInk,
  count,
  onClick,
  children,
}: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "5px 12px",
        borderRadius: 6,
        border: "1.5px solid",
        cursor: "pointer",
        transition: "all 0.12s",
        display: "flex",
        alignItems: "center",
        gap: 6,
        borderColor: active ? color : "var(--dl-border)",
        background: active ? background : "transparent",
        color: active ? (activeInk ?? color) : "var(--dl-muted)",
      }}
    >
      {children}
      {count !== undefined && (
        <span
          style={{
            fontSize: 10,
            fontFamily: DL_MONO,
            background: active ? color : "var(--dl-border)",
            color: active ? "#fff" : "var(--dl-muted)",
            borderRadius: 10,
            padding: "1px 6px",
            lineHeight: 1.4,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
