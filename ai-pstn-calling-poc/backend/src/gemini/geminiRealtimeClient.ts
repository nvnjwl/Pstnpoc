import { EventEmitter } from "node:events";
import { env } from "../config/env.js";
import type { GeminiAudioChunk, GeminiTranscriptChunk } from "./geminiTypes.js";

export type GeminiRealtimeEvents = {
  transcript: (chunk: GeminiTranscriptChunk) => void;
  audio: (chunk: GeminiAudioChunk) => void;
  error: (error: Error) => void;
};

export class GeminiRealtimeClient extends EventEmitter {
  private active = false;
  private mockInterval?: NodeJS.Timeout;

  start() {
    if (this.active) return;
    this.active = true;

    if (env.mockMode) {
      this.mockInterval = setInterval(() => {
        if (!this.active) return;
        const text = "Namaste! Main Aarav bol raha hoon. Kya aapko callback schedule karna hai?";
        this.emit("transcript", { text, final: true });
        this.emit("audio", { audio: Buffer.from("mock-audio") });
      }, 6000);
    }
  }

  stop() {
    this.active = false;
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = undefined;
    }
  }

  sendAudio(_audio: Buffer) {
    if (!this.active) return;

    if (!env.mockMode) {
      this.emit(
        "error",
        new Error("Gemini realtime streaming is not configured. Enable MOCK_MODE for local testing.")
      );
    }
  }
}
