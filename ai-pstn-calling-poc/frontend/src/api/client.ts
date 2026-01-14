export type StartCallResponse = {
  callSessionId: string;
  exotelCallId?: string;
  streamToken: string;
};

export const startCall = async (to: string): Promise<StartCallResponse> => {
  const response = await fetch("/api/call/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error ?? "Failed to start call");
  }

  return (await response.json()) as StartCallResponse;
};
