import type { SessionStatus } from "./session";

export type Device = {
  deviceId: string;
  name: string;
  platform: string;
  ipAddress?: string;
  connectionStatus: SessionStatus;
};
