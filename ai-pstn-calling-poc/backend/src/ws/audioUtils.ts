export const isBinaryMessage = (data: unknown): data is Buffer => Buffer.isBuffer(data);
