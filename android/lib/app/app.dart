import 'package:flutter/material.dart';
import 'package:kru_android/app/router.dart';
import 'package:kru_android/app/theme.dart';
import 'package:kru_android/features/qr_scanner/presentation/scanner_page.dart';

class KruApp extends StatelessWidget {
  const KruApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kru',
      theme: buildAppTheme(),
      initialRoute: AppRoutes.scanner,
      onGenerateRoute: buildRoute,
      debugShowCheckedModeBanner: false,
    );
  }
}

Route<dynamic> buildRoute(RouteSettings settings) {
  switch (settings.name) {
    case AppRoutes.scanner:
      return MaterialPageRoute(builder: (_) => const ScannerPage());
    default:
      return MaterialPageRoute(
        builder: (_) => const ScannerPage(),
        settings: const RouteSettings(name: AppRoutes.scanner),
      );
  }
}
