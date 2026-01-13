import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/screens/dashboard_screen.dart';
import 'package:diamond_tracker_mobile/screens/login_screen.dart';
import 'package:diamond_tracker_mobile/state/auth_controller.dart';

class DiamondApp extends ConsumerStatefulWidget {
  const DiamondApp({super.key});

  @override
  ConsumerState<DiamondApp> createState() => _DiamondAppState();
}

class _DiamondAppState extends ConsumerState<DiamondApp> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(authControllerProvider.notifier).loadSession());
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return MaterialApp(
      title: 'Diamond Tracker',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F766E)),
        useMaterial3: true,
      ),
      home: authState.isAuthenticated ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
