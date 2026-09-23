import 'dart:async';

import 'package:flutter/material.dart';
import 'package:kru_android/core/network/network_place.dart';
import 'package:kru_android/core/network/signaling_client.dart';
import 'package:kru_android/features/connection/application/connection_controller.dart';
import 'package:kru_android/features/device/application/device_identity.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/shared/models/session_status.dart';
import 'package:kru_android/shared/widgets/status_banner.dart';

class ConnectionPage extends StatefulWidget {
  const ConnectionPage({super.key, required this.payload, this.controller});

  final QrPayload payload;
  final ConnectionController? controller;

  @override
  State<ConnectionPage> createState() => _ConnectionPageState();
}

class _ConnectionPageState extends State<ConnectionPage> {
  SignalingClient? _ownedClient;
  late final ConnectionController _controller;
  StreamSubscription<ConnectionSnapshot>? _subscription;
  ConnectionSnapshot? _snapshot;
  Object? _error;

  @override
  void initState() {
    super.initState();
    final injected = widget.controller;
    if (injected != null) {
      _controller = injected;
    } else {
      _ownedClient = SignalingClient();
      _controller = ConnectionController(signaling: _ownedClient!);
    }
    _start();
  }

  Future<void> _start() async {
    final place = await NetworkPlace.current();
    final device = await DeviceIdentity().load(place);
    _subscription = _controller.connect(widget.payload, device).listen(
      (snapshot) {
        if (!mounted) return;
        setState(() => _snapshot = snapshot);
      },
      onError: (Object error) {
        if (!mounted) return;
        setState(() => _error = error);
      },
    );
  }

  @override
  void dispose() {
    _subscription?.cancel();
    // Don't close the persistent connection when widget is disposed.
    // The connection remains active for background transfer and operations.
    // Only dispose the owned client if this page created it.
    _ownedClient?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final connected = _snapshot?.status == SessionStatus.connected;
    final message = _error?.toString() ?? _snapshot?.detail ?? 'Connecting...';
    return Scaffold(
      appBar: AppBar(title: const Text('Connection')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: StatusBanner(
          error: _error != null,
          message: connected ? 'Connected' : message,
        ),
      ),
    );
  }
}
