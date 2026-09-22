import type { SessionStatus } from "./session";

export type Device = {
  deviceId: string;
  name: string;
  platform: string;
  manufacturer: string;
  model: string;
  brand: string;
  androidVersion: string;
  sdkInt: string;
  network: string;
  ipAddress: string;
  connectionStatus: SessionStatus;
};
