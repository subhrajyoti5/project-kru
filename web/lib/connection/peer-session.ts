"use client";

import { markConnected } from "@/lib/api/client";
import type { Device } from "@/types/device";
import type { QrPayload } from "@/types/session";
import type { FileEntry } from "@/types/filesystem";

export type PeerStatus = "idle" | "connecting" | "link" | "connected" | "disconnected" | "failed";

export type HandshakeFrame = {
  protocolVersion: 1;
  platform: string;
};

export type TransferView = {
  id: string;
  name: string;
  direction: "download" | "upload";
  total: number;
  transferred: number;
  status: "transferring" | "completed" | "failed" | "cancelled";
  error?: string;
};

export type PeerSnapshot = {
  status: PeerStatus;
  failure: string;
  device: Device | null;
  connected: boolean;
  handshake: HandshakeFrame | null;
  path: string;
  entries: FileEntry[];
  transfers: TransferView[];
  previewUrl: string;
  previewFile: { url: string; filename: string } | null;
};

type Listener = () => void;

const chunkSize = 64 * 1024;
const maxBuffered = 1024 * 1024;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

function tcpUrl(payload: QrPayload): string {
  const url = new URL(payload.signalingUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `/sessions/${payload.sessionId}/tcp`;
  url.search = "";
  return url.toString();
}

function magicMatch(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x4b &&
    bytes[1] === 0x52 &&
    bytes[2] === 0x55 &&
    bytes[3] === 0x31
  );
}

function frameUpload(transferId: string, offset: number, payload: Uint8Array): Uint8Array {
  const idBytes = new TextEncoder().encode(transferId);
  const frame = new Uint8Array(10 + idBytes.length + payload.length);
  const view = new DataView(frame.buffer);
  frame.set([0x4b, 0x52, 0x55, 0x31, 2, idBytes.length], 0);
  frame.set(idBytes, 6);
  view.setUint32(6 + idBytes.length, offset, false);
  frame.set(payload, 10 + idBytes.length);
  return frame;
}

type ChunkListener = (offset: number, payload: Uint8Array) => void;
type ResponseValue = Record<string, unknown>;
type Resolve = (value: ResponseValue) => void;

class PeerSessionImpl {
  status: PeerStatus = "idle";
  failure = "";
  device: Device | null = null;
  handshake: HandshakeFrame | null = null;
  path = "/";
  entries: FileEntry[] = [];
  transfers: TransferView[] = [];
  previewUrl = "";
  previewFile: { url: string; filename: string } | null = null;

  private channel: WebSocket | null = null;
  private sessionId = "";
  private token = "";
  private listeners = new Set<Listener>();
  private responseWaiters = new Map<string, Resolve>();
  private completeWaiters = new Map<string, Resolve>();
  private chunkListeners = new Map<string, Set<ChunkListener>>();
  private chunkBuffer = new Map<string, Array<{ offset: number; payload: Uint8Array }>>();
  private payload: QrPayload | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private manualDisconnect = false;

  get connected(): boolean {
    return this.status === "connected";
  }

  private _cachedSnapshot: PeerSnapshot | null = null;

  get snapshot(): PeerSnapshot {
    if (!this._cachedSnapshot) {
      this._cachedSnapshot = {
        status: this.status,
        failure: this.failure,
        device: this.device,
        connected: this.connected,
        handshake: this.handshake,
        path: this.path,
        entries: this.entries,
        transfers: this.transfers,
        previewUrl: this.previewUrl,
        previewFile: this.previewFile,
      };
    }
    return this._cachedSnapshot;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this._cachedSnapshot = null;
    for (const listener of this.listeners) listener();
  }

  private set(status: PeerStatus, failure = "") {
    this.status = status;
    this.failure = failure;
    this.emit();
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    if (this.channel?.readyState === WebSocket.OPEN) {
      this.heartbeatTimer = setInterval(() => {
        try {
          if (this.channel?.readyState === WebSocket.OPEN) {
            this.channel.send(JSON.stringify({ type: "ping" }));
          }
        } catch {
          // Ignore errors
        }
      }, HEARTBEAT_INTERVAL);
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  async start(payload: QrPayload) {
    if (this.channel) this.stop();
    this.payload = payload;
    this.sessionId = payload.sessionId;
    this.token = payload.token;
    this.device = null;
    this.handshake = null;
    this.chunkBuffer.clear();
    this.manualDisconnect = false;
    this.set("connecting");
    const socket = new WebSocket(tcpUrl(payload));
    socket.binaryType = "arraybuffer";
    this.channel = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", role: "browser", token: payload.token }));
      this.startHeartbeat();
    };
    socket.onmessage = (event) => {
      if (typeof event.data === "string") this.onControl(event.data);
      else this.onBinary(event.data as ArrayBuffer);
    };
    socket.onclose = () => {
      if (this.channel !== socket) return;
      this.stopHeartbeat();
      if (this.manualDisconnect) {
        this.channel = null;
        this.failActive();
        this.set("idle", "");
      } else {
        // Connection lost, show disconnected state
        this.channel = null;
        this.failActive();
        this.set("disconnected", "Connection to the phone ended. Waiting to reconnect...");
      }
    };
    socket.onerror = () => {
      if (this.channel !== socket) return;
      if (this.status === "connected") return;
      this.set("failed", "Make sure your phone and computer are on the same Wi-Fi network.");
    };
  }

  reconnect(payload: QrPayload) {
    return this.start(payload);
  }

  async disconnect() {
    this.manualDisconnect = true;
    this.stopHeartbeat();
    if (this.channel?.readyState === WebSocket.OPEN) {
      this.channel.send(JSON.stringify({ type: "disconnect" }));
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    if (this.channel?.readyState === WebSocket.OPEN) {
      this.channel.close();
    }
    this.channel = null;
    this.failActive();
    this.set("idle", "");
  }

  async openDirectory(nextPath: string) {
    if (!this.channel || this.channel.readyState !== WebSocket.OPEN) {
      // If socket is not open, do not throw unhandled exception to UI
      return;
    }
    try {
      const res = await this.request({ type: "list_directory", path: nextPath });
      if (res.success === false) {
        console.warn("list_directory unsuccessful:", res.error);
        return;
      }
      this.path = (res.path as string) ?? nextPath;
      this.entries = (res.entries as any[]) ?? [];
      this.previewUrl = "";
      this.emit();
    } catch (err) {
      console.warn("openDirectory failed:", err);
    }
  }

  async createFolder(name: string) {
    const res = await this.request({ type: "create_directory", path: this.path, name });
    if (res.success === false) throw new Error((res.error as any)?.message || "Failed to create folder");
    await this.openDirectory(this.path);
  }

  async rename(entry: FileEntry, name: string) {
    const res = await this.request({ type: "rename", path: entry.path, name });
    if (res.success === false) throw new Error((res.error as any)?.message || "Failed to rename");
    await this.openDirectory(this.path);
  }

  async remove(entry: FileEntry) {
    const res = await this.request({ type: "delete", path: entry.path });
    if (res.success === false) throw new Error((res.error as any)?.message || "Failed to delete");
    await this.openDirectory(this.path);
  }

  async cancel(id: string) {
    this.sendControl({ type: "transfer_cancel", transferId: id });
    const t = this.transfers.find(x => x.id === id);
    if (t) {
      t.status = "cancelled";
      this.transfers = [...this.transfers];
      this.emit();
    }
  }

  async upload(parentPath: string, file: File) {
    const res = await this.request({ type: "upload_request", path: parentPath, name: file.name, size: file.size });
    if (res.success === false) throw new Error((res.error as any)?.message || "Failed to upload");
    
    const transferId = res.transferId as string;
    const transfer: TransferView = {
      id: transferId,
      name: file.name,
      direction: "upload",
      total: file.size,
      transferred: 0,
      status: "transferring",
    };
    this.transfers = [...this.transfers, transfer];
    this.emit();

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        if (transfer.status !== "transferring") break;
        const chunk = bytes.slice(offset, offset + chunkSize);
        await this.sendUploadFrame(transferId, offset, chunk);
        transfer.transferred += chunk.length;
        this.transfers = [...this.transfers];
        this.emit();
      }
      
      if (transfer.status === "transferring") {
        const completeRes = await this.request({ type: "upload_complete", transferId, requestId: crypto.randomUUID() });
        if (completeRes.success === false) throw new Error((completeRes.error as any)?.message || "Failed to complete upload");
        transfer.status = "completed";
      }
    } catch (err: any) {
      transfer.status = "failed";
      transfer.error = err.message;
    }
    this.transfers = [...this.transfers];
    this.emit();
    await this.openDirectory(this.path);
  }

  async download(entry: FileEntry) {
    const res = await this.request({ type: "download_request", path: entry.path });
    if (res.success === false) throw new Error((res.error as any)?.message || "Failed to download");
    
    const transferId = res.transferId as string;
    const transfer: TransferView = {
      id: transferId,
      name: entry.name,
      direction: "download",
      total: entry.size,
      transferred: 0,
      status: "transferring",
    };
    this.transfers = [...this.transfers, transfer];
    this.emit();

    // Use a Map to store chunks by offset to handle out-of-order delivery
    const chunkMap = new Map<number, Uint8Array>();
    let lastProcessedOffset = 0;
    let totalReceived = 0;

    const unlisten = this.onDownloadChunks(transferId, (offset, payload) => {
      chunkMap.set(offset, payload);
      totalReceived += payload.length;
      transfer.transferred = totalReceived;
      this.transfers = [...this.transfers];
      this.emit();
    });

    try {
      const result = await this.awaitDownloadComplete(transferId);
      transfer.status = "completed";
      
      // Assemble chunks in correct order using offsets
      const chunks: Uint8Array[] = [];
      const expectedSize = result.actualSize;
      let currentOffset = 0;
      
      while (currentOffset < expectedSize) {
        const chunk = chunkMap.get(currentOffset);
        if (!chunk) {
          throw new Error(`Missing chunk at offset ${currentOffset}`);
        }
        chunks.push(chunk);
        currentOffset += chunk.length;
      }
      
      // Verify checksum if provided
      if (result.sha256) {
        const blob = new Blob(chunks as BlobPart[], { type: (res.mimeType as string) || "application/octet-stream" });
        const calculatedHash = await this.calculateSHA256(blob);
        if (calculatedHash !== result.sha256) {
          throw new Error(`Checksum mismatch: expected ${result.sha256}, got ${calculatedHash}`);
        }
      }
      
      const blob = new Blob(chunks as BlobPart[], { type: (res.mimeType as string) || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      
      // Store preview file instead of auto-downloading
      this.previewFile = { url, filename: entry.name };
      this.emit();
    } catch (err: any) {
      transfer.status = "failed";
      transfer.error = err.message;
    } finally {
      unlisten();
    }
    
    this.transfers = [...this.transfers];
    this.emit();
  }

  downloadPreview() {
    if (!this.previewFile) return;
    
    const a = document.createElement("a");
    a.href = this.previewFile.url;
    a.download = this.previewFile.filename;
    a.click();
  }

  closePreview() {
    if (this.previewFile?.url) {
      URL.revokeObjectURL(this.previewFile.url);
    }
    this.previewFile = null;
    this.emit();
  }

  stop() {
    this.manualDisconnect = true;
    this.stopHeartbeat();
    this.channel?.close();
    this.channel = null;
    this.failActive();
    this.set("idle", "");
  }

  private failActive() {
    for (const waiter of this.responseWaiters.values()) {
      waiter({ type: "operation_response", requestId: "", success: false, error: { code: "FAILED", message: "Disconnected." } });
    }
    this.responseWaiters.clear();
    for (const waiter of this.completeWaiters.values()) {
      waiter({ type: "download_complete", transferId: "", sha256: "", actualSize: 0 });
    }
    this.completeWaiters.clear();
    for (const set of this.chunkListeners.values()) set.clear();
    this.chunkBuffer.clear();
  }

  sendControl(message: Record<string, unknown>) {
    this.channel?.send(JSON.stringify(message));
  }

  request(body: Record<string, unknown>): Promise<ResponseValue> {
    const requestId = crypto.randomUUID();
    const response = new Promise<ResponseValue>((resolve) => {
      this.responseWaiters.set(requestId, resolve);
    });
    this.sendControl({ ...body, requestId });
    return response;
  }

  sendUploadFrame(transferId: string, offset: number, payload: Uint8Array): Promise<void> {
    return new Promise<void>((resolve) => {
      const channel = this.channel;
      if (!channel) {
        resolve();
        return;
      }
      frameUpload(transferId, offset, payload);
      const drain = () => {
        if (channel.bufferedAmount > maxBuffered) {
          channel.addEventListener("bufferedamountlow", drain, { once: true });
        } else {
          resolve();
        }
      };
      drain();
    });
  }

  awaitDownloadStart(transferId: string): Promise<Record<string, unknown>> {
    return new Promise<Record<string, unknown>>((resolve) => {
      this.completeWaiters.set(transferId, resolve);
    });
  }

  onDownloadChunks(transferId: string, listener: ChunkListener) {
    const buffered = this.chunkBuffer.get(transferId);
    if (buffered) {
      for (const chunk of buffered) listener(chunk.offset, chunk.payload);
      this.chunkBuffer.delete(transferId);
    }
    let set = this.chunkListeners.get(transferId);
    if (!set) {
      set = new Set();
      this.chunkListeners.set(transferId, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
      if (set!.size === 0) this.chunkListeners.delete(transferId);
    };
  }

  awaitDownloadComplete(transferId: string): Promise<{ sha256: string; actualSize: number }> {
    return new Promise<{ sha256: string; actualSize: number }>((resolve) => {
      this.completeWaiters.set(transferId, (message) => {
        resolve({
          sha256: String(message.sha256 ?? ""),
          actualSize: Number(message.actualSize ?? 0),
        });
      });
    });
  }

  private onControl(text: string) {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return;
    }
    const type = String(message.type ?? "");

    if (type === "pong") {
      // Heartbeat response - connection is alive
      return;
    }

    if (type === "established") {
      if (this.status !== "connected") this.set("link");
      return;
    }

    if (type === "hello") {
      const dev = (message.device as Record<string, unknown> | undefined);
      this.handshake = {
        protocolVersion: 1,
        platform: String(dev?.platform ?? "unknown"),
      };
      this.sendControl({ type: "hello_ack", protocolVersion: 1, requestId: "hello" });
      if (this.status !== "connected") {
        this.set("connected");
        void markConnected(this.sessionId, this.token).catch(() => undefined);
        void this.openDirectory("/");
      }
      void this.refreshDevice();
      return;
    }

    const requestId = String(message.requestId ?? "");
    const transferId = String(message.transferId ?? "");

    if (type === "download_complete") {
      const waiter = this.completeWaiters.get(transferId);
      if (waiter) {
        waiter(message);
        this.completeWaiters.delete(transferId);
      }
      return;
    }

    const waiter = this.responseWaiters.get(requestId);
    if (waiter) {
      waiter(message);
      this.responseWaiters.delete(requestId);
    }
  }

  private async refreshDevice() {
    if (!this.payload) return;
    try {
      const { getSession } = await import("@/lib/api/client");
      const session = await getSession(this.payload.sessionId, this.payload.token);
      this.device = session.device;
      this.emit();
    } catch {
      this.device = null;
    }
  }

  private onBinary(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    if (!magicMatch(bytes)) return;
    const idLength = bytes[5];
    // Frame structure:
    // [0-3]: Magic (0x4b 0x52 0x55 0x31)
    // [4]: Version
    // [5]: idLength
    // [6 to 6+idLength-1]: transferId
    // [6+idLength to 6+idLength+3]: offset (big-endian)
    // [6+idLength+4 onwards]: payload
    const offsetStart = 6 + idLength;
    const payloadStart = offsetStart + 4;
    if (bytes.length < payloadStart) return;
    
    const transferId = new TextDecoder().decode(bytes.slice(6, 6 + idLength));
    const view = new DataView(buffer);
    const offset = view.getUint32(offsetStart, false);  // false = big-endian
    const payload = bytes.slice(payloadStart);

    const listeners = this.chunkListeners.get(transferId);
    if (listeners && listeners.size > 0) {
      for (const listener of listeners) listener(offset, payload);
      return;
    }

    let buffered = this.chunkBuffer.get(transferId);
    if (!buffered) {
      buffered = [];
      this.chunkBuffer.set(transferId, buffered);
    }
    if (buffered.length > 2048) return;
    buffered.push({ offset, payload });
  }

  private async calculateSHA256(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const peerSession = new PeerSessionImpl();
