import type { WebSocket } from "ws";
import { nanoid } from "nanoid";
import type { GeminiRealtimeClient } from "../gemini/geminiRealtimeClient.js";
import type { WsHub } from "./wsServer.js";
import type { CallStore } from "../storage/callStore.js";
import { isBinaryMessage } from "./audioUtils.js";

const MAX_DURATION_MS = 240_000;

export class StreamSession {
  private timeout?: NodeJS.Timeout;

  constructor(
    private readonly callSessionId: string,
    private readonly ws: WebSocket,
    private readonly gemini: GeminiRealtimeClient,
    private readonly hub: WsHub,
    private readonly store: CallStore
  ) {
    this.gemini.on("transcript", (chunk) => {
      const line = {
        id: nanoid(),
        timestamp: new Date().toISOString(),
        text: chunk.text,
        source: "agent" as const
      };
      const session = this.store.get(this.callSessionId);
      if (session) {
        session.transcript.push(line);
        session.updatedAt = new Date().toISOString();
        this.store.save(session);
      }
      this.hub.sendUiEvent(this.callSessionId, { type: "transcript", line });
    });

    this.gemini.on("audio", (chunk) => {
      if (this.ws.readyState === this.ws.OPEN) {
        this.ws.send(chunk.audio, { binary: true });
      }
    });

    this.gemini.on("error", (error) => {
      this.hub.sendUiEvent(this.callSessionId, { type: "error", message: error.message });
    });

    this.ws.on("message", (data) => {
      if (isBinaryMessage(data)) {
        this.gemini.sendAudio(data);
      }
    });

    this.gemini.start();
    this.timeout = setTimeout(() => {
      this.stop();
      if (this.ws.readyState === this.ws.OPEN) {
        this.ws.close(1000, "Max duration reached");
      }
    }, MAX_DURATION_MS);
  }

  stop() {
    this.gemini.stop();
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }
}
