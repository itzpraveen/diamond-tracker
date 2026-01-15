import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Modern color palette with light and dark mode support
class MajesticColors {
  // Primary brand colors
  static const ink = Color(0xFF101714);
  static const forest = Color(0xFF0F3D33);
  static const pine = Color(0xFF0B2D25);
  static const gold = Color(0xFFD4A15C);
  static const goldLight = Color(0xFFE8C896);

  // Light mode surfaces
  static const sand = Color(0xFFF7F2E9);
  static const cloud = Color(0xFFFBF7F1);
  static const mist = Color(0xFFFFFDF9);

  // Dark mode surfaces
  static const darkBg = Color(0xFF0D1117);
  static const darkSurface = Color(0xFF161B22);
  static const darkCard = Color(0xFF21262D);
  static const darkBorder = Color(0xFF30363D);

  // Semantic colors
  static const danger = Color(0xFFB42318);
  static const dangerLight = Color(0xFFFFEDEB);
  static const success = Color(0xFF0F7B4C);
  static const successLight = Color(0xFFE6F4EE);
  static const warning = Color(0xFFD97706);
  static const warningLight = Color(0xFFFFF7E6);
  static const info = Color(0xFF0369A1);
  static const infoLight = Color(0xFFE0F2FE);

  // Text colors for dark mode
  static const darkText = Color(0xFFF0F6FC);
  static const darkTextSecondary = Color(0xFF8B949E);
}

/// Theme mode notifier for state management
class ThemeNotifier extends ChangeNotifier {
  ThemeMode _mode = ThemeMode.system;

  ThemeMode get mode => _mode;

  void setTheme(ThemeMode mode) {
    _mode = mode;
    notifyListeners();
  }

  void toggleTheme() {
    _mode = _mode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }
}

/// Build light theme
ThemeData buildMajesticTheme() {
  return _buildTheme(Brightness.light);
}

/// Build dark theme
ThemeData buildMajesticDarkTheme() {
  return _buildTheme(Brightness.dark);
}

ThemeData _buildTheme(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  final base = isDark ? ThemeData.dark(useMaterial3: true) : ThemeData.light(useMaterial3: true);

  // Colors based on theme
  final bgColor = isDark ? MajesticColors.darkBg : MajesticColors.sand;
  final surfaceColor = isDark ? MajesticColors.darkSurface : MajesticColors.mist;
  final cardColor = isDark ? MajesticColors.darkCard : MajesticColors.mist;
  final textColor = isDark ? MajesticColors.darkText : MajesticColors.ink;
  final textSecondary = isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.6);
  final borderColor = isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.08);
  final primaryColor = isDark ? MajesticColors.goldLight : MajesticColors.forest;
  final onPrimaryColor = isDark ? MajesticColors.ink : Colors.white;

  final textTheme = base.textTheme.apply(
    fontFamily: 'Manrope',
    bodyColor: textColor,
    displayColor: textColor,
  );

  final headlineStyle = textTheme.headlineSmall?.copyWith(
    fontFamily: 'Fraunces',
    fontWeight: FontWeight.w600,
    color: textColor,
    letterSpacing: -0.5,
  );

  return base.copyWith(
    brightness: brightness,
    scaffoldBackgroundColor: bgColor,
    colorScheme: ColorScheme(
      brightness: brightness,
      primary: primaryColor,
      onPrimary: onPrimaryColor,
      primaryContainer: isDark ? MajesticColors.pine : MajesticColors.forest.withValues(alpha: 0.12),
      onPrimaryContainer: isDark ? MajesticColors.goldLight : MajesticColors.forest,
      secondary: MajesticColors.gold,
      onSecondary: MajesticColors.ink,
      secondaryContainer: isDark ? MajesticColors.gold.withValues(alpha: 0.2) : MajesticColors.gold.withValues(alpha: 0.15),
      onSecondaryContainer: isDark ? MajesticColors.goldLight : MajesticColors.ink,
      tertiary: MajesticColors.info,
      onTertiary: Colors.white,
      error: MajesticColors.danger,
      onError: Colors.white,
      errorContainer: isDark ? MajesticColors.danger.withValues(alpha: 0.2) : MajesticColors.dangerLight,
      onErrorContainer: MajesticColors.danger,
      surface: surfaceColor,
      onSurface: textColor,
      surfaceContainerHighest: cardColor,
      onSurfaceVariant: textSecondary,
      outline: borderColor,
      outlineVariant: borderColor.withValues(alpha: 0.5),
      shadow: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
    ),
    textTheme: textTheme.copyWith(
      headlineLarge: headlineStyle?.copyWith(fontSize: 32, fontWeight: FontWeight.w700),
      headlineMedium: headlineStyle?.copyWith(fontSize: 28),
      headlineSmall: headlineStyle?.copyWith(fontSize: 24),
      titleLarge: headlineStyle?.copyWith(fontSize: 22, letterSpacing: -0.3),
      titleMedium: textTheme.titleMedium?.copyWith(
        fontFamily: 'Manrope',
        fontSize: 16,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
      ),
      titleSmall: textTheme.titleSmall?.copyWith(
        fontFamily: 'Manrope',
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
      labelLarge: textTheme.labelLarge?.copyWith(
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      ),
      labelMedium: textTheme.labelMedium?.copyWith(
        fontWeight: FontWeight.w500,
        letterSpacing: 0.3,
      ),
      bodyLarge: textTheme.bodyLarge?.copyWith(
        fontSize: 16,
        height: 1.5,
      ),
      bodyMedium: textTheme.bodyMedium?.copyWith(
        fontSize: 14,
        height: 1.5,
      ),
      bodySmall: textTheme.bodySmall?.copyWith(
        fontSize: 12,
        color: textSecondary,
        height: 1.4,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: bgColor,
      foregroundColor: textColor,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      systemOverlayStyle: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      titleTextStyle: TextStyle(
        fontFamily: 'Fraunces',
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textColor,
        letterSpacing: -0.3,
      ),
      iconTheme: IconThemeData(color: textColor, size: 24),
    ),
    cardTheme: CardThemeData(
      color: cardColor,
      elevation: 0,
      shadowColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: borderColor, width: 1),
      ),
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: isDark ? MajesticColors.darkSurface : Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: MajesticColors.danger),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: MajesticColors.danger, width: 2),
      ),
      labelStyle: TextStyle(color: textSecondary, fontWeight: FontWeight.w500),
      hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.7)),
      prefixIconColor: textSecondary,
      suffixIconColor: textSecondary,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: onPrimaryColor,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        minimumSize: const Size(0, 52),
        textStyle: const TextStyle(
          fontFamily: 'Manrope',
          fontWeight: FontWeight.w600,
          fontSize: 15,
          letterSpacing: 0.3,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ).copyWith(
        overlayColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.pressed)) {
            return Colors.white.withValues(alpha: 0.1);
          }
          return null;
        }),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: textColor,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        minimumSize: const Size(0, 52),
        textStyle: const TextStyle(
          fontFamily: 'Manrope',
          fontWeight: FontWeight.w600,
          fontSize: 15,
          letterSpacing: 0.3,
        ),
        side: BorderSide(color: borderColor, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(
          fontFamily: 'Manrope',
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        foregroundColor: textColor,
        padding: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: primaryColor,
      foregroundColor: onPrimaryColor,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    ),
    listTileTheme: ListTileThemeData(
      iconColor: primaryColor,
      textColor: textColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      dense: false,
      minVerticalPadding: 12,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: isDark ? MajesticColors.darkCard : MajesticColors.cloud,
      labelStyle: TextStyle(
        color: textColor,
        fontWeight: FontWeight.w500,
        fontSize: 13,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: borderColor),
      ),
    ),
    dividerTheme: DividerThemeData(
      color: borderColor,
      thickness: 1,
      space: 1,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: isDark ? MajesticColors.darkCard : MajesticColors.pine,
      contentTextStyle: TextStyle(
        color: isDark ? MajesticColors.darkText : Colors.white,
        fontFamily: 'Manrope',
      ),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 4,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: cardColor,
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      titleTextStyle: headlineStyle?.copyWith(fontSize: 20),
      contentTextStyle: textTheme.bodyMedium,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: cardColor,
      elevation: 8,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      dragHandleColor: borderColor,
      dragHandleSize: const Size(40, 4),
      showDragHandle: true,
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return primaryColor;
        }
        return isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.4);
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return primaryColor.withValues(alpha: 0.3);
        }
        return isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.1);
      }),
      trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: primaryColor,
      linearTrackColor: primaryColor.withValues(alpha: 0.2),
      circularTrackColor: primaryColor.withValues(alpha: 0.2),
    ),
    tabBarTheme: TabBarThemeData(
      labelColor: primaryColor,
      unselectedLabelColor: textSecondary,
      indicatorColor: primaryColor,
      labelStyle: const TextStyle(fontWeight: FontWeight.w600),
      unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500),
    ),
  );
}

/// Background decoration with subtle gradient
BoxDecoration majesticBackground({bool isDark = false}) {
  if (isDark) {
    return const BoxDecoration(
      color: MajesticColors.darkBg,
    );
  }
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

/// Animated gradient background for special screens
class AnimatedGradientBackground extends StatefulWidget {
  const AnimatedGradientBackground({
    super.key,
    required this.child,
    this.isDark = false,
  });

  final Widget child;
  final bool isDark;

  @override
  State<AnimatedGradientBackground> createState() => _AnimatedGradientBackgroundState();
}

class _AnimatedGradientBackgroundState extends State<AnimatedGradientBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment(
                0.5 + 0.5 * _controller.value,
                1.0 - 0.3 * _controller.value,
              ),
              colors: widget.isDark
                  ? [
                      MajesticColors.darkBg,
                      MajesticColors.darkSurface,
                      MajesticColors.darkBg,
                    ]
                  : [
                      MajesticColors.sand,
                      Color.lerp(MajesticColors.sand, MajesticColors.cloud, _controller.value)!,
                      MajesticColors.cloud,
                    ],
            ),
          ),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}
