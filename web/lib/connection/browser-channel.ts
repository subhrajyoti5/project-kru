import type { QrPayload } from "@/types/session";

export const sameNetworkMessage =
  "Unable to connect. Make sure your phone and computer are connected to the same Wi-Fi network.";

export type BrowserChannel = {
  close: () => void;
};

type Listeners = {
  onOpen: () => void;
  onFail: (message: string) => void;
};

function tcpUrl(payload: QrPayload): string {
  const url = new URL(payload.signalingUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `/sessions/${payload.sessionId}/tcp`;
  url.search = "";
  return url.toString();
}

export function startBrowserChannel(payload: QrPayload, listeners: Listeners): BrowserChannel {
  let stopped = false;
  const socket = new WebSocket(tcpUrl(payload));
  const fail = (message: string) => {
    if (stopped) return;
    stopped = true;
    listeners.onFail(message);
    socket.close();
  };

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "join", role: "browser", token: payload.token }));
  };
  socket.onmessage = (event) => {
    if (typeof event.data !== "string") {
      fail("File bytes arrived on the TCP session.");
      return;
    }
    const message = JSON.parse(event.data) as { type?: string };
    if (message.type === "established") listeners.onOpen();
  };
  socket.onerror = () => fail(sameNetworkMessage);

  return {
    close: () => {
      stopped = true;
      socket.close();
    },
  };
}
