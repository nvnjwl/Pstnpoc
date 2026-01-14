import { Router } from "express";
import { env } from "../config/env.js";
import type { CallStore, CallStatus } from "../storage/callStore.js";
import type { WsHub } from "../ws/wsServer.js";
import { generateStreamToken } from "../ws/streamToken.js";

const toStatus = (status?: string): CallStatus | undefined => {
  switch (status) {
    case "initiated":
    case "ringing":
    case "answered":
    case "completed":
    case "failed":
      return status;
    default:
      return undefined;
  }
};

export const createWebhookRoutes = (store: CallStore, hub: WsHub) => {
  const router = Router();

  router.post("/status", (req, res) => {
    const payload = req.body as { CallSid?: string; Status?: string; Reason?: string };
    const exotelCallId = payload.CallSid;
    const status = toStatus(payload.Status?.toLowerCase());
    if (!exotelCallId || !status) {
      return res.status(400).json({ error: "Invalid status payload" });
    }

    const session = store.list().find((call) => call.exotelCallId === exotelCallId);
    if (!session) {
      return res.status(404).json({ error: "Call session not found" });
    }

    const entry = {
      status,
      timestamp: new Date().toISOString(),
      reason: payload.Reason
    };
    session.status = status;
    session.timeline.push(entry);
    session.updatedAt = new Date().toISOString();
    store.save(session);

    hub.sendUiEvent(session.id, { type: "status", status, timeline: session.timeline });
    return res.json({ ok: true });
  });

  router.post("/connect", (req, res) => {
    const callSessionId = (req.query.callSessionId as string | undefined) ?? "";
    if (!callSessionId) {
      return res.status(400).send("Missing callSessionId");
    }

    const token = generateStreamToken(env.streamTokenSecret, env.streamTokenTtlSeconds);
    const wsUrl = `${env.publicBaseUrl.replace("http", "ws")}/ws/exotel/stream?token=${token}&callSessionId=${callSessionId}`;

    res.setHeader("Content-Type", "application/xml");
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`);
  });

  return router;
};
