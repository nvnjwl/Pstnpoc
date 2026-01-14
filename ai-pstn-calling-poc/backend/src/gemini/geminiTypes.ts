export type GeminiTranscriptChunk = {
  text: string;
  final: boolean;
};

export type GeminiAudioChunk = {
  audio: Buffer;
};
