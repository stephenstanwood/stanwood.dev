import { useState, useEffect } from "react";
import { MS_PER_MINUTE, msSince } from "../lib/time";
import { formatHourMinute } from "../lib/dateFormat";
import { useJsonOnMount } from "../hooks/useJsonOnMount";
import type { DeployData } from "../lib/shipClockStatus";

const BARCODE_BAR_COUNT = 60; // enough bars to span the tile width

/** Generate pseudo-barcode widths from a string (for visual effect only).
 *  Repeats the SHA pattern, emitting alternating bar/gap widths — so the returned
 *  array is BARCODE_BAR_COUNT * 2 long and even indexes are bars, odd ones gaps. */
function barsFromSha(sha: string): number[] {
  const widths: number[] = [];
  for (let i = 0; widths.length < BARCODE_BAR_COUNT * 2; i++) {
    const code = sha.charCodeAt(i % sha.length);
    widths.push(code % 2 === 0 ? 2 : 1); // bar width
    widths.push(code % 3 === 0 ? 2 : 1); // gap width
  }
  return widths;
}

function formatElapsed(ms: number): string {
  const totalMin = Math.floor(ms / MS_PER_MINUTE);
  const totalHr = Math.floor(totalMin / 60);
  const totalDays = Math.floor(totalHr / 24);

  if (totalMin < 1) return "just now";
  if (totalMin < 60) return `${totalMin}m ago`;
  if (totalHr < 24) return `${totalHr}h ${totalMin % 60}m ago`;
  if (totalDays < 7) return `${totalDays}d ${totalHr % 24}h ago`;
  return `${totalDays}d ago`;
}

/** One label/value line item on the receipt. */
function ReceiptRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="sct-row">
      <span className="sct-row-label">{label}</span>
      {value && <span className="sct-row-value">{value}</span>}
    </div>
  );
}

/** The receipt with a single status row — what the tile shows before the fetch lands
 *  and when the deploy lookup comes back empty. */
function ReceiptStub({ label, value }: { label: string; value?: string }) {
  return (
    <div className="proj-tile sct-tile">
      <div className="sct-inner">
        <div className="sct-logo">stanwood.dev</div>
        <div className="sct-header">
          <span className="sct-store">latest update</span>
        </div>
        <ReceiptRow label={label} value={value} />
      </div>
    </div>
  );
}

export default function ShipClockTile() {
  const { data } = useJsonOnMount<DeployData>("/api/ship-clock");
  const [elapsed, setElapsed] = useState("");

  // Tick every 30s
  useEffect(() => {
    if (!data?.lastDeploy) return;
    const update = () => {
      setElapsed(formatElapsed(msSince(data.lastDeploy!)));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [data?.lastDeploy]);

  if (!data) return <ReceiptStub label="loading…" />;

  if (data.error || !data.lastDeploy) return <ReceiptStub label="status" value="offline" />;

  const deployDate = new Date(data.lastDeploy);
  const dayName = deployDate.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
  const dateStr = deployDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
  const timeStr = formatHourMinute(deployDate).toLowerCase();

  return (
    <div className="proj-tile sct-tile">
      <div className="sct-inner">
        <div className="sct-logo">stanwood.dev</div>
        <div className="sct-header">
          <span className="sct-store">latest update</span>
          {elapsed && <span className="sct-elapsed">{elapsed}</span>}
        </div>
        <ReceiptRow label="day" value={dayName} />
        <ReceiptRow label="date" value={dateStr} />
        <ReceiptRow label="time" value={timeStr} />
        {(data.sha || data.prNumber) && (
          <ReceiptRow
            label="order #"
            value={data.prNumber ? `PR${data.prNumber}` : data.sha!}
          />
        )}
        {data.summary && (
          <>
            <hr className="sct-divider" />
            <div className="sct-blurb">
              {data.project && <span className="sct-project">{data.project}: </span>}
              <span className="sct-desc">{data.summary}</span>
            </div>
          </>
        )}
      </div>
      {data.sha && (
        <div className="sct-barcode" aria-hidden="true">
          {barsFromSha(data.sha).map((w, i) => (
            <span
              key={i}
              className={i % 2 === 0 ? "sct-bar" : "sct-gap"}
              style={{ "--w": w } as React.CSSProperties}
            />
          ))}
        </div>
      )}
      <div className="sct-footer">thank you for visiting</div>
    </div>
  );
}
