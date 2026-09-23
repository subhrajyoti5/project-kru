import type { Device } from "./device";

export type SessionStatus = "pending" | "paired" | "connected" | "disconnected" | "expired" | "closed";

export type Session = {
  sessionId: string;
  browserId: string;
  createdAt: string;
  expiresAt: string;
  status: SessionStatus;
  device: Device | null;
};

export type QrPayload = {
  version: 1;
  sessionId: string;
  token: string;
  expiresAt: string;
  signalingUrl: string;
};

export type CreatedSession = {
  session: Session;
  qrPayload: QrPayload;
};
