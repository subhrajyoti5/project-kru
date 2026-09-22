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
  final _controller = TextEditingController();
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

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    _open(_controller.text.trim());
  }

  void _open(String raw) {
    if (_opened) return;
    try {
      final payload = _decoder(raw);
      _opened = true;
      setState(() => _error = null);
      Navigator.of(context)
          .push(MaterialPageRoute(builder: (_) => ConnectionPage(payload: payload)))
          .then((_) => _opened = false);
    } on AppException catch (error) {
      setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan QR')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'On your computer, open the website and show its QR code. This phone scans that code.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 16),
          if (_useCamera)
            SizedBox(
              height: 280,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: QrCamera(onPayload: _open),
              ),
            ),
          const SizedBox(height: 16),
          const Text('Or paste the QR payload.'),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            minLines: 4,
            maxLines: 8,
            decoration: const InputDecoration(
              labelText: 'QR payload',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: _submit, child: const Text('Decode and connect')),
          if (_error != null) ...[
            const SizedBox(height: 16),
            StatusBanner(message: _error!, error: true),
          ],
        ],
      ),
    );
  }
}
