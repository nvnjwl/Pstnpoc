import { useMemo, useRef, useState } from "react";
import { startCall } from "../api/client";
import { CallStatusPanel } from "../components/CallStatusPanel";
import { TranscriptPanel } from "../components/TranscriptPanel";

export type CallTimelineEntry = {
  status: string;
  timestamp: string;
  reason?: string;
};

export type TranscriptLine = {
  id: string;
  timestamp: string;
  text: string;
  source: "agent" | "customer" | "system";
};

type UiEvent =
  | { type: "status"; status: string; timeline: CallTimelineEntry[] }
  | { type: "transcript"; line: TranscriptLine }
  | { type: "error"; message: string }
  | { type: "connected" };

export const DialerPage = () => {
  const [phone, setPhone] = useState("");
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<CallTimelineEntry[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const statusLabel = useMemo(() => {
    if (timeline.length === 0) return "Idle";
    return timeline[timeline.length - 1].status;
  }, [timeline]);

  const addLog = (message: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} ${message}`, ...prev].slice(0, 200));
  };

  const connectUiSocket = (sessionId: string) => {
    const ws = new WebSocket(`${location.origin.replace("http", "ws")}/ws/ui/session?callSessionId=${sessionId}`);
    wsRef.current = ws;

    ws.addEventListener("open", () => addLog("UI socket connected"));
    ws.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data) as UiEvent;
      if (payload.type === "status") {
        setTimeline(payload.timeline);
      }
      if (payload.type === "transcript") {
        setTranscript((prev) => [...prev, payload.line]);
      }
      if (payload.type === "error") {
        addLog(`Error: ${payload.message}`);
      }
    });
    ws.addEventListener("close", () => addLog("UI socket closed"));
  };

  const handleStartCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await startCall(phone.trim());
      setCallSessionId(response.callSessionId);
      setTimeline([{ status: "initiated", timestamp: new Date().toISOString() }]);
      setTranscript([]);
      connectUiSocket(response.callSessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start call");
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    addLog("Call ended by user");
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32, fontFamily: "Inter, sans-serif" }}>
      <h1>AI PSTN Calling POC</h1>
      <p>Start a PSTN call and stream real-time transcripts.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginTop: 20
        }}
      >
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }} htmlFor="phone">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91xxxxxxxxxx"
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              onClick={handleStartCall}
              disabled={loading}
              style={{ padding: "10px 16px", borderRadius: 8, background: "#2563eb", color: "white" }}
            >
              {loading ? "Calling..." : "Call"}
            </button>
            <button
              onClick={handleEndCall}
              style={{ padding: "10px 16px", borderRadius: 8, background: "#ef4444", color: "white" }}
            >
              End
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Status:</strong> {statusLabel}
          </div>
          {callSessionId && (
            <div style={{ marginTop: 4 }}>
              <strong>Session:</strong> {callSessionId}
            </div>
          )}
          {error && (
            <div style={{ marginTop: 8, color: "#b91c1c" }}>
              {error}
            </div>
          )}
        </div>

        <CallStatusPanel timeline={timeline} />
      </div>

      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <TranscriptPanel lines={transcript} />
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <button
            onClick={() => setShowLogs((prev) => !prev)}
            style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8 }}
          >
            {showLogs ? "Hide" : "Show"} Debug Logs
          </button>
          {showLogs && (
            <div style={{ maxHeight: 300, overflowY: "auto", fontSize: 12 }}>
              {logs.length === 0 && <p>No logs yet.</p>}
              {logs.map((log, index) => (
                <div key={`${log}-${index}`}>{log}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
