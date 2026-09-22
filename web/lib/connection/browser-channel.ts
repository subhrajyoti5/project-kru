import { markConnected, postSignal, readSignals } from "@/lib/api/client";
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

export function startBrowserChannel(payload: QrPayload, listeners: Listeners): BrowserChannel {
  let stopped = false;
  const peer = new RTCPeerConnection({ iceServers: [] });
  const channel = peer.createDataChannel("kru");
  const pendingIce: RTCIceCandidateInit[] = [];
  let remoteSet = false;
  let after = 0;

  const fail = (message: string) => {
    if (stopped) return;
    stopped = true;
    listeners.onFail(message);
    peer.close();
  };

  channel.onopen = () => {
    if (stopped) return;
    stopped = true;
    markConnected(payload.sessionId, payload.token).catch(() => {
      // The data channel is already open. Polling still observes session status.
    });
    listeners.onOpen();
  };

  peer.onconnectionstatechange = () => {
    if (peer.connectionState === "failed") fail(sameNetworkMessage);
  };

  peer.onicecandidate = (event) => {
    if (!event.candidate) return;
    postSignal(payload.sessionId, payload.token, "ice", {
      candidate: event.candidate.candidate,
      sdpMid: event.candidate.sdpMid,
      sdpMLineIndex: event.candidate.sdpMLineIndex,
    }).catch((cause: unknown) => {
      fail(cause instanceof Error ? cause.message : sameNetworkMessage);
    });
  };

  const pump = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await postSignal(payload.sessionId, payload.token, "offer", {
      type: "offer",
      sdp: offer.sdp,
    });

    const deadline = Date.now() + 60_000;
    while (!stopped && Date.now() < deadline) {
      const signals = await readSignals(payload.sessionId, payload.token, after);
      for (const signal of signals) {
        after = signal.id;
        if (signal.role !== "android") continue;
        if (signal.type === "answer" && typeof signal.payload.sdp === "string") {
          await peer.setRemoteDescription({ type: "answer", sdp: signal.payload.sdp });
          remoteSet = true;
          for (const candidate of pendingIce) {
            await peer.addIceCandidate(candidate);
          }
          pendingIce.length = 0;
        } else if (signal.type === "ice" && typeof signal.payload.candidate === "string") {
          const candidate: RTCIceCandidateInit = {
            candidate: signal.payload.candidate,
            sdpMid: typeof signal.payload.sdpMid === "string" ? signal.payload.sdpMid : undefined,
            sdpMLineIndex:
              typeof signal.payload.sdpMLineIndex === "number" ? signal.payload.sdpMLineIndex : undefined,
          };
          if (remoteSet) await peer.addIceCandidate(candidate);
          else pendingIce.push(candidate);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    if (!stopped) fail(sameNetworkMessage);
  };

  pump().catch((cause: unknown) => {
    fail(cause instanceof Error ? cause.message : sameNetworkMessage);
  });

  return {
    close: () => {
      stopped = true;
      peer.close();
    },
  };
}
