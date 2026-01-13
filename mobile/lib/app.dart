import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/screens/dashboard_screen.dart';
import 'package:diamond_tracker_mobile/screens/login_screen.dart';
import 'package:diamond_tracker_mobile/state/auth_controller.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';

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

    return MaterialApp(
      title: 'Majestic Tracking',
      debugShowCheckedModeBanner: false,
      theme: buildMajesticTheme(),
      home: authState.isAuthenticated ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
