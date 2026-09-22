import 'package:flutter/material.dart';

/// Shell for a future on-device file view.
/// The desktop browser is the file manager; this page is not the product UI.
class FileBrowserPage extends StatelessWidget {
  const FileBrowserPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Files')),
      body: const Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Phone files are exposed to the desktop only after a LAN channel is open. '
          'This screen does not upload anything.',
        ),
      ),
    );
  }
}
