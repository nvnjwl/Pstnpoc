export type ExotelCallResponse = {
  callSid: string;
};

export type ExotelStatusEvent = {
  callSid: string;
  status: "initiated" | "ringing" | "answered" | "completed" | "failed";
  timestamp: string;
  reason?: string;
};
