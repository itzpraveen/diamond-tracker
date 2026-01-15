import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/screens/dashboard_screen.dart';
import 'package:diamond_tracker_mobile/screens/login_screen.dart';
import 'package:diamond_tracker_mobile/state/auth_controller.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';

/// Theme mode state provider
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.system);

  void setTheme(ThemeMode mode) => state = mode;

  void toggleTheme() {
    if (state == ThemeMode.light) {
      state = ThemeMode.dark;
    } else if (state == ThemeMode.dark) {
      state = ThemeMode.light;
    } else {
      // System mode - toggle to explicit light or dark based on current brightness
      state = ThemeMode.dark;
    }
  }
}

class MajesticApp extends ConsumerStatefulWidget {
  const MajesticApp({super.key});

  @override
  ConsumerState<MajesticApp> createState() => _MajesticAppState();
}

class _MajesticAppState extends ConsumerState<MajesticApp> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(authControllerProvider.notifier).loadSession());
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp(
      title: 'Majestic Tracking',
      debugShowCheckedModeBanner: false,
      theme: buildMajesticTheme(),
      darkTheme: buildMajesticDarkTheme(),
      themeMode: themeMode,
      home: authState.isAuthenticated ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
