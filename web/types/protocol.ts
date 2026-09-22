export type TransferStatus =
  | "queued"
  | "preparing"
  | "transferring"
  | "completed"
  | "failed"
  | "cancelled";

export type TransferDirection = "download" | "upload";

export interface Transfer {
  id: string;
  name: string;
  direction: TransferDirection;
  total: number;
  transferred: number;
  status: TransferStatus;
  error?: string;
  startedAt: number;
  completedAt?: number;
  mimeType?: string;
  blobUrl?: string;
  speedBps?: number;
  etaMs?: number;
}

export interface DownloadHandle {
  id: string;
  cancel: () => void;
  retry: () => void;
}

export interface TransferEvent {
  type: "added" | "progress" | "complete" | "fail" | "removed";
  transfer: Transfer;
}
