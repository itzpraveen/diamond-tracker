import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:diamond_tracker_mobile/main.dart' as app;

Future<void> _pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 20),
}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 200));
    if (finder.evaluate().isNotEmpty) return;
  }
  throw TestFailure('Timed out waiting for ${finder.describeMatch(Plurality.zero)}.');
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  const username = String.fromEnvironment('TEST_USERNAME');
  const password = String.fromEnvironment('TEST_PASSWORD');
  final shouldSkip = username.isEmpty || password.isEmpty;

  testWidgets(
    'login and reach dashboard',
    (tester) async {
      if (shouldSkip) return;

      app.main();
      await tester.pump(const Duration(seconds: 1));

      final usernameField = find.byKey(const Key('login_username'));
      final passwordField = find.byKey(const Key('login_password'));
      final submitButton = find.byKey(const Key('login_submit'));
      final dashboardHeader = find.byKey(const Key('dashboard_workload'));

      if (dashboardHeader.evaluate().isEmpty) {
        await _pumpUntilFound(tester, usernameField);
        await tester.enterText(usernameField, username);
        await tester.enterText(passwordField, password);
        await tester.tap(submitButton);
      }

      await _pumpUntilFound(tester, dashboardHeader);
      expect(find.byKey(const Key('dashboard_sync_status')), findsOneWidget);
    },
    skip: shouldSkip,
  );
}
