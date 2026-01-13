import 'package:flutter/material.dart';

class MajesticColors {
  static const ink = Color(0xFF101714);
  static const forest = Color(0xFF0F3D33);
  static const pine = Color(0xFF0B2D25);
  static const gold = Color(0xFFD4A15C);
  static const sand = Color(0xFFF7F2E9);
  static const cloud = Color(0xFFFBF7F1);
  static const mist = Color(0xFFFFFDF9);
  static const danger = Color(0xFFB42318);
}

ThemeData buildMajesticTheme() {
  final base = ThemeData.light();
  final textTheme = base.textTheme.apply(
    fontFamily: 'Manrope',
    bodyColor: MajesticColors.ink,
    displayColor: MajesticColors.ink,
  );

  final headlineStyle = textTheme.headlineSmall?.copyWith(
    fontFamily: 'Fraunces',
    fontWeight: FontWeight.w600,
    color: MajesticColors.ink,
  );

  return base.copyWith(
    useMaterial3: true,
    scaffoldBackgroundColor: MajesticColors.sand,
    colorScheme: const ColorScheme(
      brightness: Brightness.light,
      primary: MajesticColors.forest,
      onPrimary: Colors.white,
      secondary: MajesticColors.gold,
      onSecondary: MajesticColors.ink,
      error: MajesticColors.danger,
      onError: Colors.white,
      background: MajesticColors.sand,
      onBackground: MajesticColors.ink,
      surface: MajesticColors.mist,
      onSurface: MajesticColors.ink,
    ),
    textTheme: textTheme.copyWith(
      headlineSmall: headlineStyle,
      titleLarge: headlineStyle?.copyWith(fontSize: 22),
      titleMedium: headlineStyle?.copyWith(fontSize: 18, fontWeight: FontWeight.w600),
      labelLarge: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: MajesticColors.sand,
      foregroundColor: MajesticColors.ink,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: 'Fraunces',
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: MajesticColors.ink,
      ),
    ),
    cardTheme: CardTheme(
      color: MajesticColors.mist,
      elevation: 0.5,
      shadowColor: Colors.black.withOpacity(0.08),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: MajesticColors.ink.withOpacity(0.12)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: MajesticColors.gold, width: 1.2),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: MajesticColors.forest,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: MajesticColors.ink,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        textStyle: const TextStyle(fontWeight: FontWeight.w600),
        side: BorderSide(color: MajesticColors.ink.withOpacity(0.2)),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
      ),
    ),
    listTileTheme: ListTileThemeData(
      iconColor: MajesticColors.forest,
      textColor: MajesticColors.ink,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      dense: false,
    ),
    dividerColor: MajesticColors.ink.withOpacity(0.08),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: MajesticColors.pine,
      contentTextStyle: const TextStyle(color: Colors.white),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
  );
}

BoxDecoration majesticBackground() {
  return const BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        MajesticColors.sand,
        Color(0xFFFDF9F2),
        MajesticColors.cloud,
      ],
    ),
  );
}
