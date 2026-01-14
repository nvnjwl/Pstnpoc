import { env } from "../config/env.js";
import { ExotelCallResponse } from "./exotelTypes.js";

const buildAuthHeader = () => {
  const token = Buffer.from(`${env.exotel.apiKey}:${env.exotel.apiToken}`).toString("base64");
  return `Basic ${token}`;
};

export const startExotelCall = async (
  to: string,
  callSessionId: string
): Promise<ExotelCallResponse> => {
  if (env.mockMode) {
    return { callSid: `mock-${Date.now()}` };
  }

  const url = `https://${env.exotel.subdomain}/v1/Accounts/${env.exotel.accountSid}/Calls/connect`;
  const body = new URLSearchParams({
    From: env.exotel.callerId,
    To: to,
    CallerId: env.exotel.callerId,
    Url: `${env.publicBaseUrl}/api/exotel/connect?callSessionId=${encodeURIComponent(callSessionId)}`,
    StatusCallback: `${env.publicBaseUrl}/api/exotel/status`,
    StatusCallbackContentType: "application/json"
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Exotel call failed: ${response.status} ${message}`);
  }

  const data = (await response.json()) as { Call?: { Sid?: string } };
  const callSid = data.Call?.Sid ?? `unknown-${Date.now()}`;
  return { callSid };
};
