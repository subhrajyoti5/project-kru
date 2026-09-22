import 'dart:async';

import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/core/network/signaling_client.dart';
import 'package:kru_android/features/connection/data/lan_channel.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/shared/models/session_status.dart';

/// Answers the browser's WebRTC offer and waits until the data channel opens.
class WebRtcLanChannel implements LanChannel {
  WebRtcLanChannel(this._signaling);

  final SignalingClient _signaling;
  RTCPeerConnection? _peer;
  bool _closed = false;

  @override
  Future<SessionStatus> open(QrPayload payload) async {
    _closed = false;
    final peer = await createPeerConnection({'iceServers': <dynamic>[]});
    _peer = peer;
    final opened = Completer<void>();
    final pendingIce = <RTCIceCandidate>[];
    var remoteSet = false;

    peer.onDataChannel = (channel) {
      channel.onDataChannelState = (state) {
        if (state == RTCDataChannelState.RTCDataChannelOpen && !opened.isCompleted) {
          opened.complete();
        }
      };
    };
    peer.onIceCandidate = (candidate) {
      final value = candidate.candidate;
      if (value == null || value.isEmpty) return;
      _signaling.sendSignal(
        payload: payload,
        type: 'ice',
        signalPayload: {
          'candidate': value,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
        },
      );
    };
    peer.onConnectionState = (state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed && !opened.isCompleted) {
        opened.completeError(AppException(sameNetworkMessage, code: 'lan'));
      }
    };

    final deadline = DateTime.now().add(const Duration(seconds: 25));
    var after = 0;
    String? remoteSdp;

    while (!_closed && DateTime.now().isBefore(deadline)) {
      final signals = await _signaling.readSignals(payload: payload, after: after);
      for (final signal in signals) {
        after = signal.id;
        if (signal.role != 'browser') continue;
        if (signal.type == 'offer') {
          remoteSdp = signal.payload['sdp'] as String?;
        } else if (signal.type == 'ice') {
          final candidate = _candidate(signal.payload);
          if (candidate == null) continue;
          if (remoteSet) {
            await peer.addCandidate(candidate);
          } else {
            pendingIce.add(candidate);
          }
        }
      }
      if (remoteSdp != null && !remoteSet) {
        await peer.setRemoteDescription(RTCSessionDescription(remoteSdp, 'offer'));
        remoteSet = true;
        for (final candidate in pendingIce) {
          await peer.addCandidate(candidate);
        }
        pendingIce.clear();
        final answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await _signaling.sendSignal(
          payload: payload,
          type: 'answer',
          signalPayload: {'type': 'answer', 'sdp': answer.sdp},
        );
      }
      if (opened.isCompleted) break;
      await Future<void>.delayed(const Duration(milliseconds: 400));
    }

    if (!opened.isCompleted) {
      throw AppException(sameNetworkMessage, code: 'lan');
    }
    await opened.future;
    return SessionStatus.connected;
  }

  RTCIceCandidate? _candidate(Map<String, Object?> payload) {
    final value = payload['candidate'];
    if (value is! String || value.isEmpty) return null;
    final index = payload['sdpMLineIndex'];
    return RTCIceCandidate(
      value,
      payload['sdpMid'] as String?,
      index is int ? index : int.tryParse('$index'),
    );
  }

  @override
  Future<void> close() async {
    _closed = true;
    await _peer?.close();
    _peer = null;
  }
}
