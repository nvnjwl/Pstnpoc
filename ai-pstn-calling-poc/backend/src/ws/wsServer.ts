import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { env } from "../config/env.js";
import type { CallSession, CallStatus, CallStore } from "../storage/callStore.js";
import { GeminiRealtimeClient } from "../gemini/geminiRealtimeClient.js";
import { StreamSession } from "./streamSession.js";
import { verifyStreamToken } from "./streamToken.js";

export type UiEvent =
  | { type: "status"; status: CallStatus; timeline: CallSession["timeline"] }
  | { type: "transcript"; line: CallSession["transcript"][number] }
  | { type: "error"; message: string }
  | { type: "connected" };

export class WsHub {
  private uiSessions = new Map<string, Set<WebSocket>>();
  private exotelSessions = new Map<string, StreamSession>();
  private wss: WebSocketServer;

  constructor(server: http.Server, private readonly store: CallStore) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      const { url } = request;
      if (!url) {
        socket.destroy();
        return;
      }

      if (url.startsWith("/ws/ui/session")) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleUiSession(ws, request);
        });
        return;
      }

      if (url.startsWith("/ws/exotel/stream")) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleExotelStream(ws, request);
        });
        return;
      }

      socket.destroy();
    });
  }

  private handleUiSession(ws: WebSocket, request: http.IncomingMessage) {
    const url = new URL(request.url ?? "", env.publicBaseUrl);
    const callSessionId = url.searchParams.get("callSessionId");
    if (!callSessionId) {
      ws.close(1008, "Missing callSessionId");
      return;
    }

    const set = this.uiSessions.get(callSessionId) ?? new Set<WebSocket>();
    set.add(ws);
    this.uiSessions.set(callSessionId, set);
    ws.send(JSON.stringify({ type: "connected" } satisfies UiEvent));

    ws.on("close", () => {
      set.delete(ws);
      if (set.size === 0) {
        this.uiSessions.delete(callSessionId);
      }
    });
  }

  private handleExotelStream(ws: WebSocket, request: http.IncomingMessage) {
    const url = new URL(request.url ?? "", env.publicBaseUrl);
    const callSessionId = url.searchParams.get("callSessionId");
    const token = url.searchParams.get("token");
    if (!callSessionId || !token) {
      ws.close(1008, "Missing token or callSessionId");
      return;
    }

    const valid = verifyStreamToken(token, env.streamTokenSecret, env.streamTokenTtlSeconds);
    if (!valid) {
      ws.close(1008, "Invalid token");
      return;
    }

    const session = new StreamSession(callSessionId, ws, new GeminiRealtimeClient(), this, this.store);
    this.exotelSessions.set(callSessionId, session);

    ws.on("close", () => {
      session.stop();
      this.exotelSessions.delete(callSessionId);
    });
  }

  sendUiEvent(callSessionId: string, event: UiEvent) {
    const set = this.uiSessions.get(callSessionId);
    if (!set) return;
    const payload = JSON.stringify(event);
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}
