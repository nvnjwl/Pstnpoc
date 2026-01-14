import type { CallTimelineEntry } from "../pages/DialerPage";

export const CallStatusPanel = ({ timeline }: { timeline: CallTimelineEntry[] }) => {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <h3>Status Timeline</h3>
      <ol style={{ paddingLeft: 16 }}>
        {timeline.length === 0 && <li>No status yet.</li>}
        {timeline.map((entry, index) => (
          <li key={`${entry.status}-${index}`}>
            <strong>{entry.status}</strong> — {new Date(entry.timestamp).toLocaleTimeString()}
            {entry.reason ? ` (${entry.reason})` : ""}
          </li>
        ))}
      </ol>
    </div>
  );
};
