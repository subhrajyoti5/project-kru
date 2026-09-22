import { markConnected } from "@/lib/api/client";
import type { FileEntry } from "@/types/filesystem";
import type { QrPayload } from "@/types/session";

const chunkSize = 64 * 1024;

export type TransferView = {
  id: string;
  name: string;
  direction: "download" | "upload";
  transferred: number;
  total: number;
  status: "transferring" | "completed" | "failed" | "cancelled";
  error?: string;
};

type Listener = () => void;

class PeerSession {
  status: "idle" | "connecting" | "connected" | "disconnected" | "failed" = "idle";
  failure = "";
  path = "/";
  entries: FileEntry[] = [];
  transfers: TransferView[] = [];
  previewUrl = "";
  snapshot = {
    entries: [] as FileEntry[],
    path: "/",
    transfers: [] as TransferView[],
    previewUrl: "",
    status: "idle" as PeerSession["status"],
  };
  private channel: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private waiters = new Map<string, (message: Record<string, unknown>) => void>();
  private downloads = new Map<string, { chunks: Uint8Array[]; size: number; got: number; name: string; mime: string }>();
  private pendingComplete = new Map<string, Record<string, unknown>>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.snapshot = {
      entries: this.entries,
      path: this.path,
      transfers: this.transfers,
      previewUrl: this.previewUrl,
      status: this.status,
    };
    for (const listener of this.listeners) listener();
  }

  async start(payload: QrPayload) {
    if (this.channel) this.stop();
    this.status = "connecting";
    this.failure = "";
    this.emit();
    const url = new URL(payload.signalingUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `/sessions/${payload.sessionId}/tcp`;
    url.search = "";
    const socket = new WebSocket(url.toString());
    socket.binaryType = "arraybuffer";
    this.channel = socket;
    socket.onmessage = (event) => {
      if (typeof event.data === "string") this.onControl(event.data, payload);
      else this.onBinary(event.data as ArrayBuffer);
    };
    socket.onclose = () => {
      if (this.channel !== socket) return;
      this.status = "disconnected";
      this.failTransfers();
      this.emit();
    };
    socket.onerror = () => {
      if (this.status === "connected") return;
      this.status = "failed";
      this.failure = "The TCP connection to the laptop failed. Keep the laptop on this phone's hotspot or the same home Wi-Fi.";
      this.emit();
    };
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: "join", role: "browser", token: payload.token }));
        resolve();
      };
      socket.addEventListener("error", () => reject(new Error(this.failure || "TCP connection failed.")), { once: true });
    });
  }

  stop() {
    this.channel?.close();
    this.channel = null;
    this.status = "disconnected";
    this.failTransfers();
    this.emit();
  }

  async openDirectory(path: string) {
    const message = await this.request({ type: "list_directory", path });
    const entries = Array.isArray(message.entries) ? message.entries : [];
    this.path = path;
    this.entries = entries.map((entry) => {
      const row = entry as Record<string, unknown>;
      const entryPath = String(row.path ?? "");
      return {
        id: entryPath,
        name: String(row.name ?? ""),
        path: entryPath,
        type: String(row.type ?? "file"),
        size: Number(row.size ?? 0),
        modifiedAt: row.modifiedAt ? new Date(Number(row.modifiedAt)).toISOString() : "",
        isDirectory: row.type === "directory",
        mimeType: String(row.mimeType ?? ""),
      };
    });
    this.emit();
  }

  async download(entry: FileEntry) {
    const message = await this.request({ type: "download_request", path: entry.path });
    if (message.success === false) throw new Error(this.errorText(message));
    const transferId = String(message.transferId ?? "");
    const total = Number(message.size ?? entry.size);
    const done = this.pendingComplete.get(transferId) ?? (await this.waitFor(transferId));
    this.pendingComplete.delete(transferId);
    const hash = String(done.sha256 ?? "");
    const file = this.assemble(transferId);
    const actual = await sha256(file);
    if (hash && actual !== hash) {
      this.upsert({ id: transferId, name: entry.name, direction: "download", transferred: file.byteLength, total, status: "failed", error: "Checksum mismatch." });
      return;
    }
    this.upsert({ id: transferId, name: entry.name, direction: "download", transferred: file.byteLength, total, status: "completed" });
    const blob = new Blob([file], { type: String(message.mimeType ?? "application/octet-stream") });
    const url = URL.createObjectURL(blob);
    if (String(message.mimeType ?? "").startsWith("image/") && file.byteLength < 8 * 1024 * 1024) {
      this.previewUrl = url;
      this.emit();
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = entry.name;
    anchor.click();
  }

  async upload(parent: string, file: File) {
    const hash = file.size > 32 * 1024 * 1024 ? "" : await sha256(new Uint8Array(await file.arrayBuffer()));
    const start = await this.request({ type: "upload_request", path: parent, name: file.name, size: file.size });
    if (start.success === false) throw new Error(this.errorText(start));
    const transferId = String(start.transferId);
    this.upsert({ id: transferId, name: file.name, direction: "upload", transferred: 0, total: file.size, status: "transferring" });
    let offset = 0;
    while (offset < file.size) {
      const slice = new Uint8Array(await file.slice(offset, offset + chunkSize).arrayBuffer());
      await this.sendFrame(transferId, offset, slice);
      offset += slice.length;
      this.upsert({ id: transferId, name: file.name, direction: "upload", transferred: offset, total: file.size, status: "transferring" });
    }
    const done = await this.request({ type: "upload_complete", transferId, sha256: hash });
    if (done.success === false || (done.sha256 && done.sha256 !== hash)) {
      this.upsert({ id: transferId, name: file.name, direction: "upload", transferred: offset, total: file.size, status: "failed", error: this.errorText(done) });
      return;
    }
    this.upsert({ id: transferId, name: file.name, direction: "upload", transferred: file.size, total: file.size, status: "completed" });
    await this.openDirectory(parent);
  }

  async createFolder(name: string) {
    await this.request({ type: "create_directory", path: this.path, name });
    await this.openDirectory(this.path);
  }

  async rename(entry: FileEntry, name: string) {
    await this.request({ type: "rename", path: entry.path, name });
    await this.openDirectory(this.path);
  }

  async remove(entry: FileEntry) {
    await this.request({ type: "delete", path: entry.path });
    await this.openDirectory(this.path);
  }

  cancel(id: string) {
    this.send({ type: "transfer_cancel", transferId: id, requestId: crypto.randomUUID() });
    const current = this.transfers.find((transfer) => transfer.id === id);
    if (current) this.upsert({ ...current, status: "cancelled" });
  }

  private async request(body: Record<string, unknown>) {
    const requestId = crypto.randomUUID();
    const response = this.waitFor(requestId);
    this.send({ ...body, requestId });
    return response;
  }

  private waitFor(id: string) {
    return new Promise<Record<string, unknown>>((resolve) => {
      this.waiters.set(id, resolve);
    });
  }

  private send(message: Record<string, unknown>) {
    this.channel?.send(JSON.stringify(message));
  }

  private async sendFrame(transferId: string, offset: number, payload: Uint8Array) {
    const channel = this.channel;
    if (!channel) return;
    const idBytes = new TextEncoder().encode(transferId);
    const frame = new Uint8Array(10 + idBytes.length + payload.length);
    const view = new DataView(frame.buffer);
    frame.set([0x4b, 0x52, 0x55, 0x31, 2, idBytes.length]);
    frame.set(idBytes, 6);
    view.setUint32(6 + idBytes.length, offset);
    frame.set(payload, 10 + idBytes.length);
    while (channel.bufferedAmount > 1024 * 1024) {
      await new Promise((resolve) => channel.addEventListener("bufferedamountlow", resolve, { once: true }));
    }
    channel.send(frame);
  }

  private onControl(text: string, payload: QrPayload) {
    const message = JSON.parse(text) as Record<string, unknown>;
    if (message.type === "hello") {
      this.send({ type: "hello_ack", protocolVersion: 1, requestId: "hello" });
      this.status = "connected";
      markConnected(payload.sessionId, payload.token).catch(() => undefined);
      this.openDirectory("/").catch(() => undefined);
      this.emit();
      return;
    }
    const requestId = String(message.requestId ?? "");
    const transferId = String(message.transferId ?? "");
    if (message.type === "download_start") {
      const total = Number(message.size ?? 0);
      this.downloads.set(transferId, {
        chunks: [],
        size: total,
        got: 0,
        name: String(message.name ?? ""),
        mime: String(message.mimeType ?? ""),
      });
      this.upsert({ id: transferId, name: String(message.name ?? ""), direction: "download", transferred: 0, total, status: "transferring" });
      this.waiters.get(requestId)?.(message);
      this.waiters.delete(requestId);
      return;
    }
    if (message.type === "download_complete") {
      const waiter = this.waiters.get(transferId);
      if (waiter) {
        waiter(message);
        this.waiters.delete(transferId);
      } else {
        this.pendingComplete.set(transferId, message);
      }
      return;
    }
    if (this.waiters.has(requestId)) {
      this.waiters.get(requestId)?.(message);
      this.waiters.delete(requestId);
    }
  }

  private onBinary(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 14 || bytes[0] !== 0x4b) return;
    const idLength = bytes[5];
    const transferId = new TextDecoder().decode(bytes.slice(6, 6 + idLength));
    const view = new DataView(buffer);
    const offset = view.getUint32(6 + idLength);
    const payload = bytes.slice(10 + idLength);
    const download = this.downloads.get(transferId);
    if (!download) return;
    download.chunks.push(payload);
    download.got += payload.length;
    this.upsert({
      id: transferId,
      name: download.name,
      direction: "download",
      transferred: download.got,
      total: download.size,
      status: "transferring",
    });
    void offset;
  }

  private assemble(transferId: string) {
    const download = this.downloads.get(transferId);
    const chunks = download?.chunks ?? [];
    const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const file = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      file.set(chunk, offset);
      offset += chunk.length;
    }
    return file;
  }

  private upsert(next: TransferView) {
    const index = this.transfers.findIndex((transfer) => transfer.id === next.id);
    if (index === -1) this.transfers = [next, ...this.transfers];
    else this.transfers = this.transfers.map((transfer) => (transfer.id === next.id ? next : transfer));
    this.emit();
  }

  private failTransfers() {
    this.transfers = this.transfers.map((transfer) =>
      transfer.status === "transferring" ? { ...transfer, status: "failed", error: "Disconnected." } : transfer,
    );
  }

  private errorText(message: Record<string, unknown>) {
    const error = message.error as { message?: string } | undefined;
    return error?.message ?? "The phone rejected the request.";
  }
}

async function sha256(bytes: Uint8Array) {
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", copy);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const peerSession = new PeerSession();
