import 'dart:io';

import 'package:flutter/material.dart';
import 'package:kru_android/core/errors/app_exception.dart';
import 'package:kru_android/features/connection/presentation/connection_page.dart';
import 'package:kru_android/features/qr_scanner/application/decode_qr.dart';
import 'package:kru_android/features/qr_scanner/presentation/qr_camera.dart';
import 'package:kru_android/shared/widgets/status_banner.dart';
import 'package:permission_handler/permission_handler.dart';

/// The phone scans the QR shown by the website.
class ScannerPage extends StatefulWidget {
  const ScannerPage({super.key, this.decoder, this.useCamera});

  final DecodeQr? decoder;

  /// Tests run without a camera plugin. Production leaves this null.
  final bool? useCamera;

  @override
  State<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends State<ScannerPage> {
  late final DecodeQr _decoder = widget.decoder ?? DecodeQr();
  late final bool _useCamera =
      widget.useCamera ?? !Platform.environment.containsKey('FLUTTER_TEST');
  String? _error;
  bool _opened = false;

  @override
  void initState() {
    super.initState();
    _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    await Permission.manageExternalStorage.request();
    await Permission.storage.request();
  }

  void _open(String raw) {
    if (_opened) return;
    try {
      final payload = _decoder(raw);
      _opened = true;
      setState(() => _error = null);
      Navigator.of(context)
          .push(
            PageRouteBuilder(
              pageBuilder: (_, animation, secondaryAnimation) =>
                  ConnectionPage(payload: payload),
              transitionsBuilder: (_, animation, _, child) {
                return FadeTransition(
                  opacity: CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutCubic,
                  ),
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.05),
                      end: Offset.zero,
                    ).animate(
                      CurvedAnimation(
                        parent: animation,
                        curve: Curves.easeOutCubic,
                      ),
                    ),
                    child: child,
                  ),
                );
              },
              transitionDuration: const Duration(milliseconds: 320),
            ),
          )
          .then((_) => _opened = false);
    } on AppException catch (error) {
      setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF27272A)),
                    ),
                    child: const Icon(
                      Icons.qr_code_scanner_rounded,
                      size: 20,
                      color: Color(0xFF10B981),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'KRU LINK',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.5,
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                      ),
                      const Text(
                        'Scan Web Code',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.4,
                          color: Color(0xFFF4F4F5),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Center(
                  child: AspectRatio(
                    aspectRatio: 1.0,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF18181B),
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(
                          color: const Color(0xFF27272A),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.4),
                            blurRadius: 30,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          if (_useCamera)
                            QrCamera(onPayload: _open)
                          else
                            Center(
                              child: Text(
                                'Camera inactive in test',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.4),
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          // Premium minimalist corner focus brackets
                          IgnorePointer(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Stack(
                                children: [
                                  Align(
                                    alignment: Alignment.topLeft,
                                    child: Container(
                                      width: 28,
                                      height: 28,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          top: BorderSide(
                                            color: Color(0xFF10B981),
                                            width: 3.5,
                                          ),
                                          left: BorderSide(
                                            color: Color(0xFF10B981),
                                            width: 3.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.topRight,
                                    child: Container(
                                      width: 28,
                                      height: 28,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          top: BorderSide(
                                            color: Color(0xFF10B981),
                                            width: 3.5,
                                          ),
                                          right: BorderSide(
                                            color: Color(0xFF10B981),
                                            width: 3.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.bottomLeft,
                                    child: Container(
                                      width: 28,
                                      height: 28,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          bottom: BorderSide(
                                            color: Color(0xFF10B981),
                                            width: 3.5,
                                          ),
                                          left: BorderSide(
                                            color: Color(0xFF10B981),
                                            width: 3.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.bottomRight,
                                    child: Container(
                                      width: 28,
                                      height: 28,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          bottom: BorderSide(
                                            color: Color(0xFF10B981),
                                            width: 3.5,
                                          ),
                                          right: BorderSide(
                                            color: Color(0xFF10B981),
                                            width: 3.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF27272A)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(
                              alpha: 0.12,
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.wifi_tethering_rounded,
                            size: 18,
                            color: Color(0xFF10B981),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'Point camera at the QR code on your desktop browser. Direct Wi-Fi sync will start.',
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.4,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    StatusBanner(message: _error!, error: true),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

