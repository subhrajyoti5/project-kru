import 'dart:async';

import 'package:flutter/material.dart';
import 'package:kru_android/core/network/network_place.dart';
import 'package:kru_android/core/network/signaling_client.dart';
import 'package:kru_android/features/connection/application/connection_controller.dart';
import 'package:kru_android/features/device/application/device_identity.dart';
import 'package:kru_android/features/device/data/device_info.dart';
import 'package:kru_android/features/qr_scanner/data/qr_payload.dart';
import 'package:kru_android/shared/models/session_status.dart';

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
  DeviceInfo? _device;
  Object? _error;
  int _tabIndex = 0;

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
    if (mounted) setState(() => _device = device);
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
    _ownedClient?.close();
    super.dispose();
  }

  Future<void> _handleDisconnect() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18181B),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFF27272A)),
        ),
        title: const Text(
          'Disconnect Device?',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Color(0xFFF4F4F5),
          ),
        ),
        content: const Text(
          'This will close the active sync session with the desktop browser.',
          style: TextStyle(
            fontSize: 14,
            height: 1.4,
            color: Color(0xFFA1A1AA),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFFA1A1AA))),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Disconnect'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await _controller.disconnect();
      if (mounted) Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final connected = _snapshot?.status == SessionStatus.connected;
    final message = _error?.toString() ?? _snapshot?.detail ?? 'Connecting...';

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F11),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F11),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Color(0xFFF4F4F5)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: connected ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                boxShadow: [
                  BoxShadow(
                    color: (connected ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withValues(alpha: 0.6),
                    blurRadius: 8,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              connected ? 'Connected' : 'Syncing...',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFFF4F4F5),
              ),
            ),
          ],
        ),
        actions: [
          if (connected)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: TextButton(
                onPressed: _handleDisconnect,
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFFEF4444),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                ),
                child: const Text(
                  'End',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ),
            ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        child: _tabIndex == 0
            ? _buildOverviewTab(connected, message)
            : _buildDetailsTab(),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF141416),
          border: Border(
            top: BorderSide(color: Color(0xFF27272A), width: 0.8),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.speed_rounded, 'Session'),
                _buildNavItem(1, Icons.phone_android_rounded, 'Device'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _tabIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _tabIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF10B981).withValues(alpha: 0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? const Color(0xFF10B981) : const Color(0xFF71717A),
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF10B981),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewTab(bool connected, String message) {
    return ListView(
      key: const ValueKey('overview'),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      children: [
        // Main Hero Status Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF18181B),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: connected
                  ? const Color(0xFF10B981).withValues(alpha: 0.3)
                  : const Color(0xFF27272A),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (connected ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      connected ? 'LAN LINK ACTIVE' : 'CONNECTING',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: connected ? const Color(0xFF34D399) : const Color(0xFFFBBF24),
                      ),
                    ),
                  ),
                  Icon(
                    connected ? Icons.cloud_done_rounded : Icons.sync_rounded,
                    color: connected ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    size: 22,
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                connected ? 'Web Dashboard Connected' : message,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.4,
                  color: Color(0xFFF4F4F5),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                connected
                    ? 'Persistent Wi-Fi bridge established. You can browse, upload, or download files directly from your desktop browser.'
                    : 'Awaiting handshake with desktop browser session...',
                style: const TextStyle(
                  fontSize: 13,
                  height: 1.45,
                  color: Color(0xFFA1A1AA),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Quick Indicators Row
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                title: 'Network',
                value: _device?.network ?? 'Wi-Fi',
                icon: Icons.wifi_rounded,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricTile(
                title: 'Data Channel',
                value: 'Direct LAN',
                icon: Icons.lock_outline_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),

        // Disconnect Button Card
        if (connected)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF18181B),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFF27272A)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Session Active',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFF4F4F5),
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Stays connected until manually ended',
                        style: TextStyle(fontSize: 12, color: Color(0xFF71717A)),
                      ),
                    ],
                  ),
                ),
                FilledButton.tonal(
                  onPressed: _handleDisconnect,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFEF4444).withValues(alpha: 0.15),
                    foregroundColor: const Color(0xFFF87171),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Disconnect', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildDetailsTab() {
    final dev = _device;
    return ListView(
      key: const ValueKey('details'),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF18181B),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF27272A)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Device Information',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFF4F4F5),
                ),
              ),
              const SizedBox(height: 16),
              _buildInfoRow('Device Name', dev?.name ?? 'Android phone'),
              _buildInfoRow('Manufacturer', dev?.manufacturer ?? 'Unknown'),
              _buildInfoRow('Model', dev?.model ?? 'Unknown'),
              _buildInfoRow('Android Version', dev?.androidVersion ?? 'Unknown'),
              _buildInfoRow('Platform', dev?.platform ?? 'android'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMetricTile({required String title, required String value, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF18181B),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF27272A),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: const Color(0xFF10B981)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF71717A)),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFF4F4F5),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF71717A))),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFFF4F4F5),
            ),
          ),
        ],
      ),
    );
  }
}

