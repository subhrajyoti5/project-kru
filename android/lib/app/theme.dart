import 'package:flutter/material.dart';

ThemeData buildAppTheme() {
  // Apple Design System Colors - Enhanced for accessibility
  const primaryBlue = Color(0xFF0066cc);       // Action Blue
  const primaryBlueFocus = Color(0xFF0071e3); // Focus Blue
  const canvasWhite = Color(0xFFffffff);      // White
  const parchmentLight = Color(0xFFf5f5f7);   // Parchment
  const darkTile1 = Color(0xFF272729);        // Near-Black Tile 1
  const darkTile2 = Color(0xFF2a2a2c);        // Near-Black Tile 2
  const appleBlack = Color(0xFF000000);       // Pure Black
  const bodyOnDark = Color(0xFFffffff);       // Body on Dark
  const bodyMuted = Color(0xFFcccccc);        // Body Muted
  const inkMuted = Color(0xFF7a7a7a);         // Ink Muted
  const errorRed = Color(0xFFFF3B30);         // Error Red

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: darkTile1,
    primaryColor: primaryBlue,
    colorScheme: const ColorScheme.dark(
      primary: primaryBlue,
      primaryContainer: primaryBlueFocus,
      secondary: parchmentLight,
      secondaryContainer: darkTile2,
      surface: darkTile1,
      surfaceContainerHighest: darkTile2,
      onSurface: bodyOnDark,
      onPrimary: canvasWhite,
      background: darkTile1,
      onBackground: bodyOnDark,
      error: errorRed,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: appleBlack,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.374,
        color: bodyOnDark,
      ),
      toolbarHeight: 44,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: darkTile1,
      indicatorColor: primaryBlue,
      labelTextStyle: MaterialStateProperty.all(
        const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          letterSpacing: -0.12,
        ),
      ),
    ),
    textTheme: const TextTheme(
      // Hero Display
      displayLarge: TextStyle(
        fontSize: 56,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.28,
        height: 1.07,
        color: bodyOnDark,
      ),
      // Display Large
      displayMedium: TextStyle(
        fontSize: 40,
        fontWeight: FontWeight.w600,
        letterSpacing: 0,
        height: 1.1,
        color: bodyOnDark,
      ),
      // Display Medium
      displaySmall: TextStyle(
        fontSize: 34,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.374,
        height: 1.47,
        color: bodyOnDark,
      ),
      // Headline = Tagline
      headlineMedium: TextStyle(
        fontSize: 21,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.231,
        height: 1.19,
        color: bodyOnDark,
      ),
      // Title = Body Strong
      titleLarge: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.374,
        height: 1.24,
        color: bodyOnDark,
      ),
      // Body
      bodyLarge: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w400,
        letterSpacing: -0.374,
        height: 1.47,
        color: bodyOnDark,
      ),
      // Body Medium
      bodyMedium: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w400,
        letterSpacing: -0.374,
        height: 1.47,
        color: bodyOnDark,
      ),
      // Caption Strong
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.224,
        height: 1.29,
        color: bodyOnDark,
      ),
      // Caption
      labelSmall: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        letterSpacing: -0.224,
        height: 1.43,
        color: bodyMuted,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryBlue,
        foregroundColor: canvasWhite,
        disabledBackgroundColor: inkMuted.withOpacity(0.3),
        disabledForegroundColor: inkMuted,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(9999),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 11),
        textStyle: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.374,
        ),
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryBlue,
        side: const BorderSide(color: primaryBlue, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
        disabledForegroundColor: inkMuted,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryBlue,
        disabledForegroundColor: inkMuted,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    cardTheme: CardThemeData(
      color: darkTile2,
      elevation: 0,
      margin: const EdgeInsets.all(0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(
          color: Color(0xFF333333),
          width: 0.5,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: darkTile2,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9999),
        borderSide: const BorderSide(color: inkMuted),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9999),
        borderSide: const BorderSide(color: inkMuted, width: 0.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9999),
        borderSide: const BorderSide(color: primaryBlue, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9999),
        borderSide: const BorderSide(color: errorRed, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(9999),
        borderSide: const BorderSide(color: errorRed, width: 1.5),
      ),
      labelStyle: const TextStyle(
        color: inkMuted,
        fontSize: 17,
        fontWeight: FontWeight.w500,
      ),
      hintStyle: TextStyle(
        color: inkMuted.withOpacity(0.7),
        fontSize: 17,
        fontWeight: FontWeight.w400,
      ),
      errorStyle: const TextStyle(
        color: errorRed,
        fontSize: 13,
        fontWeight: FontWeight.w500,
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

