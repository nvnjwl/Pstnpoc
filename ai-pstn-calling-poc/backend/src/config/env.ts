import dotenv from "dotenv";

dotenv.config();

const required = ["PUBLIC_BASE_URL", "STREAM_TOKEN_SECRET"] as const;

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Missing required env: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:3000",
  exotel: {
    accountSid: process.env.EXOTEL_ACCOUNT_SID ?? "",
    apiKey: process.env.EXOTEL_API_KEY ?? "",
    apiToken: process.env.EXOTEL_API_TOKEN ?? "",
    callerId: process.env.EXOTEL_CALLER_ID ?? "",
    appId: process.env.EXOTEL_APP_ID ?? "",
    subdomain: process.env.EXOTEL_SUBDOMAIN ?? "api.exotel.com"
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    realtimeModel: process.env.GEMINI_REALTIME_MODEL ?? "gemini-2.0-flash-realtime"
  },
  streamTokenSecret: process.env.STREAM_TOKEN_SECRET ?? "",
  streamTokenTtlSeconds: Number(process.env.STREAM_TOKEN_TTL_SECONDS ?? 300),
  callLogStore: process.env.CALL_LOG_STORE ?? "localjson",
  callLogFile: process.env.CALL_LOG_FILE ?? "./data/calls.json",
  mockMode: process.env.MOCK_MODE === "true"
};
