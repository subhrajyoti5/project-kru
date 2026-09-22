import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrCamera extends StatelessWidget {
  const QrCamera({super.key, required this.onPayload});

  final void Function(String raw) onPayload;

  @override
  Widget build(BuildContext context) {
    return MobileScanner(
      onDetect: (capture) {
        final raw = capture.barcodes.isEmpty ? null : capture.barcodes.first.rawValue;
        if (raw != null && raw.isNotEmpty) onPayload(raw);
      },
    );
  }
}
