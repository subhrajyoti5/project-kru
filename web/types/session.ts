export type SessionStatus = "pending" | "paired" | "connected" | "expired" | "closed";

export type Session = {
  sessionId: string;
  browserId: string;
  createdAt: string;
  expiresAt: string;
  status: SessionStatus;
  device: {
    deviceId: string;
    name: string;
    platform: string;
    connectionStatus: SessionStatus;
  } | null;
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
