"use client";

import { markConnected } from "@/lib/api/client";
import type { Device } from "@/types/device";
import type { QrPayload } from "@/types/session";

export type PeerStatus = "idle" | "connecting" | "link" | "connected" | "disconnected" | "failed";

export type HandshakeFrame = {
  protocolVersion: 1;
  platform: string;
};

export type PeerSnapshot = {
  status: PeerStatus;
  failure: string;
  device: Device | null;
  connected: boolean;
  handshake: HandshakeFrame | null;
};

type Listener = () => void;

const chunkSize = 64 * 1024;
const maxBuffered = 1024 * 1024;

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
type Resolve = (value: Record<string, unknown>) => void;

class PeerSessionImpl {
  status: PeerStatus = "idle";
  failure = "";
  device: Device | null = null;
  handshake: HandshakeFrame | null = null;

  private channel: WebSocket | null = null;
  private sessionId = "";
  private token = "";
  private listeners = new Set<Listener>();
  private responseWaiters = new Map<string, Resolve>();
  private completeWaiters = new Map<string, Resolve>();
  private chunkListeners = new Map<string, Set<ChunkListener>>();
  private chunkBuffer = new Map<string, Array<{ offset: number; payload: Uint8Array }>>();
  private payload: QrPayload | null = null;

  get connected(): boolean {
    return this.status === "connected";
  }

  get snapshot(): PeerSnapshot {
    return {
      status: this.status,
      failure: this.failure,
      device: this.device,
      connected: this.connected,
      handshake: this.handshake,
    };
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }

  private set(status: PeerStatus, failure = "") {
    this.status = status;
    this.failure = failure;
    this.emit();
  }

  async start(payload: QrPayload) {
    if (this.channel) this.stop();
    this.payload = payload;
    this.sessionId = payload.sessionId;
    this.token = payload.token;
    this.device = null;
    this.handshake = null;
    this.chunkBuffer.clear();
    this.set("connecting");
    const socket = new WebSocket(tcpUrl(payload));
    socket.binaryType = "arraybuffer";
    this.channel = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", role: "browser", token: payload.token }));
    };
    socket.onmessage = (event) => {
      if (typeof event.data === "string") this.onControl(event.data);
      else this.onBinary(event.data as ArrayBuffer);
    };
    socket.onclose = () => {
      if (this.channel !== socket) return;
      this.channel = null;
      this.failActive();
      this.set("disconnected", "Connection to the phone ended.");
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

  stop() {
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

  request(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const requestId = crypto.randomUUID();
    const response = new Promise<Resolve>((resolve) => {
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

    if (type === "established") {
      if (this.status !== "connected") this.set("link");
      return;
    }

    if (type === "hello") {
      this.handshake = {
        protocolVersion: Number(message.protocolVersion) || 1,
        platform: String(message.device?.platform ?? "unknown"),
      } as HandshakeFrame;
      this.sendControl({ type: "hello_ack", protocolVersion: 1, requestId: "hello" });
      if (this.status !== "connected") {
        this.set("connected");
        void markConnected(this.sessionId, this.token).catch(() => undefined);
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
    const min = 10 + idLength;
    if (bytes.length < min + 4) return;
    const transferId = new TextDecoder().decode(bytes.slice(6, 6 + idLength));
    const view = new DataView(buffer);
    const offset = view.getUint32(6 + idLength, false);
    const payload = bytes.slice(min + 4);

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
}

export const peerSession = new PeerSessionImpl();
