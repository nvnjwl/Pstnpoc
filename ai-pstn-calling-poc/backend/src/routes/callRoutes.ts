import { Router } from "express";
import { nanoid } from "nanoid";
import { startExotelCall } from "../exotel/exotelClient.js";
import { env } from "../config/env.js";
import { generateStreamToken } from "../ws/streamToken.js";
import type { CallStore, CallSession, CallStatus } from "../storage/callStore.js";
import type { WsHub } from "../ws/wsServer.js";

const phoneRegex = /^\+?[0-9]{10,15}$/;

const updateStatus = (
  session: CallSession,
  status: CallStatus,
  store: CallStore,
  hub: WsHub,
  reason?: string
) => {
  const entry = { status, timestamp: new Date().toISOString(), reason };
  session.status = status;
  session.timeline.push(entry);
  session.updatedAt = new Date().toISOString();
  store.save(session);
  hub.sendUiEvent(session.id, { type: "status", status, timeline: session.timeline });
};

export const createCallRoutes = (store: CallStore, hub: WsHub) => {
  const router = Router();

  router.post("/start", async (req, res) => {
    const { to } = req.body as { to?: string };
    if (!to || !phoneRegex.test(to)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const now = new Date().toISOString();
    const session: CallSession = {
      id: nanoid(),
      to,
      status: "initiated",
      createdAt: now,
      updatedAt: now,
      transcript: [],
      timeline: [{ status: "initiated", timestamp: now }]
    };
    store.save(session);

    try {
      const exotelResponse = await startExotelCall(to, session.id);
      session.exotelCallId = exotelResponse.callSid;
      store.save(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      updateStatus(session, "failed", store, hub, message);
      return res.status(502).json({ error: message });
    }

    if (env.mockMode) {
      setTimeout(() => updateStatus(session, "ringing", store, hub), 500);
      setTimeout(() => updateStatus(session, "answered", store, hub), 1500);
      setTimeout(() => updateStatus(session, "completed", store, hub), 8000);
    }

    const streamToken = generateStreamToken(env.streamTokenSecret, env.streamTokenTtlSeconds);

    return res.json({
      callSessionId: session.id,
      exotelCallId: session.exotelCallId,
      streamToken
    });
  });

  return router;
};
