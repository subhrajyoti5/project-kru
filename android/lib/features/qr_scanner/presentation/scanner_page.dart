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
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Kru',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.374,
                          color: const Color(0xFFffffff),
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Scan the QR code from your desktop browser',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontSize: 17,
                          fontWeight: FontWeight.w400,
                          letterSpacing: -0.374,
                          color: const Color(0xFFcccccc),
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // QR Camera Container
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Center(
                  child: AspectRatio(
                    aspectRatio: 1.0,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF2a2a2c),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: const Color(0xFF333333),
                          width: 1,
                        ),
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
                                  color: Colors.white.withOpacity(0.4),
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          // Apple-style minimalist corner focus brackets
                          IgnorePointer(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Stack(
                                children: [
                                  Align(
                                    alignment: Alignment.topLeft,
                                    child: Container(
                                      width: 32,
                                      height: 32,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          top: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.5,
                                          ),
                                          left: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.topRight,
                                    child: Container(
                                      width: 32,
                                      height: 32,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          top: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.5,
                                          ),
                                          right: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.bottomLeft,
                                    child: Container(
                                      width: 32,
                                      height: 32,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          bottom: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.5,
                                          ),
                                          left: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.bottomRight,
                                    child: Container(
                                      width: 32,
                                      height: 32,
                                      decoration: const BoxDecoration(
                                        border: Border(
                                          bottom: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.5,
                                          ),
                                          right: BorderSide(
                                            color: Color(0xFF0066cc),
                                            width: 2.5,
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

            // Instructions and Error
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2a2a2c),
                      borderRadius: BorderRadius.circular(11),
                      border: Border.all(
                        color: const Color(0xFF333333),
                        width: 0.5,
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: const Color(0xFF0066cc).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Icon(
                            Icons.info_outline,
                            size: 14,
                            color: Color(0xFF2997ff),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Make sure your phone and desktop are on the same Wi-Fi network. Position the camera to capture the QR code.',
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.43,
                              letterSpacing: -0.224,
                              color: const Color(0xFFcccccc),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
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

