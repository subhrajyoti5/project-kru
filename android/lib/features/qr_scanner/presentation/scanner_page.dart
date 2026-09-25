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
      backgroundColor: const Color(0xFF272729),
      body: SafeArea(
        child: Column(
          children: [
            // Header with improved visual hierarchy
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Kru',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.5,
                          color: const Color(0xFFffffff),
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Scan the QR code from your desktop browser',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontSize: 15,
                          fontWeight: FontWeight.w400,
                          letterSpacing: -0.3,
                          color: const Color(0xFFb0b0b0),
                          height: 1.4,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // QR Camera Container with enhanced styling
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Center(
                  child: AspectRatio(
                    aspectRatio: 1.0,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF2a2a2c),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF3a3a3c),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 24,
                            offset: const Offset(0, 8),
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
                                  color: Colors.white.withOpacity(0.5),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  letterSpacing: -0.2,
                                ),
                              ),
                            ),
                          // Enhanced Apple-style corner brackets with animation
                          IgnorePointer(
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Stack(
                                children: [
                                  Align(
                                    alignment: Alignment.topLeft,
                                    child: Container(
                                      width: 36,
                                      height: 36,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          top: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.8,
                                          ),
                                          left: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.8,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.topRight,
                                    child: Container(
                                      width: 36,
                                      height: 36,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          top: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.8,
                                          ),
                                          right: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.8,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.bottomLeft,
                                    child: Container(
                                      width: 36,
                                      height: 36,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          bottom: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.8,
                                          ),
                                          left: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.8,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.bottomRight,
                                    child: Container(
                                      width: 36,
                                      height: 36,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          bottom: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.8,
                                          ),
                                          right: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.8,
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

            // Instructions and Error with improved styling
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2a2a2c),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFF3a3a3c),
                        width: 0.8,
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: const Color(0xFF0066cc).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(7),
                          ),
                          child: const Icon(
                            Icons.info_outlined,
                            size: 16,
                            color: Color(0xFF2997ff),
                            weight: 0.5,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            'Make sure your phone and desktop are on the same Wi-Fi network. Position the camera to capture the QR code clearly.',
                            style: TextStyle(
                              fontSize: 13.5,
                              height: 1.5,
                              letterSpacing: -0.2,
                              fontWeight: FontWeight.w400,
                              color: const Color(0xFFb0b0b0),
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

