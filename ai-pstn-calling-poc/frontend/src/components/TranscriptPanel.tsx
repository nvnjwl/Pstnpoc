import type { TranscriptLine } from "../pages/DialerPage";

const bubbleStyle = (source: TranscriptLine["source"]) => {
  switch (source) {
    case "agent":
      return "#dbeafe";
    case "customer":
      return "#dcfce7";
    default:
      return "#f3f4f6";
  }
};

export const TranscriptPanel = ({ lines }: { lines: TranscriptLine[] }) => {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <h3>Transcript</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {lines.length === 0 && <p>No transcript yet.</p>}
        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              background: bubbleStyle(line.source),
              padding: 12,
              borderRadius: 10,
              fontSize: 14
            }}
          >
            <strong style={{ textTransform: "capitalize" }}>{line.source}</strong>
            <div>{line.text}</div>
            <small>{new Date(line.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};
