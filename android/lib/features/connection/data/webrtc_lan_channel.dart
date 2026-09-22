import 'dart:async';
import 'dart:convert';

import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/core/network/signaling_client.dart';
import 'package:kru_android/features/connection/data/lan_channel.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/features/transfer/data_protocol.dart';
import 'package:kru_android/shared/models/session_status.dart';

/// Answers the browser offer and serves files on a reliable WebRTC data channel.
/// The channel runs over UDP. Signaling stays on the server.
class WebRtcLanChannel implements LanChannel {
  WebRtcLanChannel(this._signaling);

  final SignalingClient _signaling;
  RTCPeerConnection? _peer;
  DataProtocol? _protocol;
  bool _closed = false;

  @override
  Future<SessionStatus> open(QrPayload payload) async {
    _closed = false;
    final laptopIp = payload.signalingUrl.host;
    final peer = await createPeerConnection({
      'iceServers': <dynamic>[],
    });
    _peer = peer;
    final opened = Completer<void>();
    final pendingIce = <RTCIceCandidate>[];
    var remoteSet = false;

    peer.onDataChannel = (channel) {
      final protocol = DataProtocol(channel);
      _protocol = protocol;
      channel.onMessage = (message) {
        if (message.isBinary) {
          protocol.onBinary(message.binary);
        } else if (message.text.contains('"hello_ack"')) {
          if (!opened.isCompleted) opened.complete();
        } else {
          protocol.onText(message.text);
        }
      };
      channel.onDataChannelState = (state) {
        if (state == RTCDataChannelState.RTCDataChannelOpen) {
          channel.send(RTCDataChannelMessage(jsonEncode({
            'type': 'hello',
            'protocolVersion': 1,
            'device': {'platform': 'android'},
          })));
        }
      };
    };
    peer.onIceCandidate = (candidate) {
      final value = _phoneCandidate(candidate.candidate, laptopIp);
      if (value == null) return;
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

    final deadline = DateTime.now().add(const Duration(seconds: 40));
    var after = 0;
    String? remoteSdp;
    while (!_closed && DateTime.now().isBefore(deadline) && !opened.isCompleted) {
      final signals = await _signaling.readSignals(payload: payload, after: after);
      for (final signal in signals) {
        after = signal.id;
        if (signal.role != 'browser') continue;
        if (signal.type == 'offer') {
          remoteSdp = signal.payload['sdp'] as String?;
        } else if (signal.type == 'ice') {
          final candidate = _candidate(signal.payload, laptopIp);
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
      await Future<void>.delayed(const Duration(milliseconds: 300));
    }
    if (!opened.isCompleted) {
      throw AppException(sameNetworkMessage, code: 'lan');
    }
    return SessionStatus.connected;
  }

  RTCIceCandidate? _candidate(Map<String, Object?> payload, String laptopIp) {
    final raw = payload['candidate'];
    if (raw is! String) return null;
    final value = raw.replaceAll(RegExp(r'[A-Za-z0-9-]+\.local'), laptopIp);
    if (!value.contains(' udp ') || !value.contains(' typ host')) return null;
    final parts = value.split(' ');
    if (parts.length < 5 || parts[4] != laptopIp) return null;
    final index = payload['sdpMLineIndex'];
    return RTCIceCandidate(
      value,
      payload['sdpMid'] as String?,
      index is int ? index : int.tryParse('$index'),
    );
  }

  String? _phoneCandidate(String? raw, String laptopIp) {
    if (raw == null || raw.isEmpty) return null;
    if (!raw.contains(' udp ') || !raw.contains(' typ host')) return null;
    final parts = raw.split(' ');
    if (parts.length < 5 || !_sameSubnet(parts[4], laptopIp)) return null;
    return raw;
  }

  bool _sameSubnet(String left, String right) {
    final a = left.split('.');
    final b = right.split('.');
    return a.length == 4 && b.length == 4 && a[0] == b[0] && a[1] == b[1] && a[2] == b[2];
  }

  @override
  Future<void> close() async {
    _closed = true;
    _protocol?.stop();
    await _peer?.close();
    _peer = null;
  }
}
