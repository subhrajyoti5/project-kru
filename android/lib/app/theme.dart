import 'package:flutter/material.dart';

ThemeData buildAppTheme() {
  const surfaceDark = Color(0xFF0F0F11);
  const cardDark = Color(0xFF18181B);
  const primaryAccent = Color(0xFF10B981); // Emerald accent

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: surfaceDark,
    colorScheme: const ColorScheme.dark(
      primary: primaryAccent,
      secondary: Color(0xFF34D399),
      surface: surfaceDark,
      surfaceContainerHighest: cardDark,
      onSurface: Color(0xFFF4F4F5),
      onPrimary: Color(0xFF064E3B),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: surfaceDark,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
        color: Color(0xFFF4F4F5),
      ),
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: ZoomPageTransitionsBuilder(),
        TargetPlatform.iOS: ZoomPageTransitionsBuilder(),
      },
    ),
  );
}

