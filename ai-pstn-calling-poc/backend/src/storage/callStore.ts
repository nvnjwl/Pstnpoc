import fs from "node:fs";
import path from "node:path";

export type CallStatus = "initiated" | "ringing" | "answered" | "completed" | "failed";

export type CallTranscriptLine = {
  id: string;
  timestamp: string;
  text: string;
  source: "agent" | "customer" | "system";
};

export type CallTimelineEntry = {
  status: CallStatus;
  timestamp: string;
  reason?: string;
};

export type CallSession = {
  id: string;
  exotelCallId?: string;
  to: string;
  status: CallStatus;
  createdAt: string;
  updatedAt: string;
  transcript: CallTranscriptLine[];
  timeline: CallTimelineEntry[];
};

export type CallStore = {
  list(): CallSession[];
  get(id: string): CallSession | undefined;
  save(session: CallSession): void;
};

const ensureFile = (filePath: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ calls: [] }, null, 2));
  }
};

export const createLocalJsonStore = (filePath: string): CallStore => {
  const absolutePath = path.resolve(filePath);
  ensureFile(absolutePath);

  const readAll = (): CallSession[] => {
    const raw = fs.readFileSync(absolutePath, "utf-8");
    const parsed = JSON.parse(raw) as { calls: CallSession[] };
    return parsed.calls ?? [];
  };

  const writeAll = (calls: CallSession[]) => {
    fs.writeFileSync(absolutePath, JSON.stringify({ calls }, null, 2));
  };

  return {
    list() {
      return readAll();
    },
    get(id: string) {
      return readAll().find((call) => call.id === id);
    },
    save(session: CallSession) {
      const calls = readAll();
      const index = calls.findIndex((call) => call.id === session.id);
      if (index >= 0) {
        calls[index] = session;
      } else {
        calls.push(session);
      }
      writeAll(calls);
    }
  };
};
