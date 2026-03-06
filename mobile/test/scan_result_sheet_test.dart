import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:diamond_tracker_mobile/screens/scan_logic.dart';
import 'package:diamond_tracker_mobile/screens/scan_screen.dart';

void main() {
  Widget wrapWithMaterial(Widget child) {
    return MaterialApp(
      home: Scaffold(body: child),
    );
  }

  ScanResultSheet buildSheet({
    required VoidCallback onConfirm,
    required VoidCallback onOpenDispatchCenter,
    String? blockingReason,
  }) {
    return ScanResultSheet(
      scannedCode: 'DJ-2026-000059',
      job: const <String, dynamic>{
        'item_description': 'SWA DIAMOND STUD',
      },
      error: null,
      currentStatus: 'PACKED_READY',
      nextStatus: 'DISPATCHED_TO_FACTORY',
      batchCode: null,
      offline: false,
      onOfflineChanged: (_) {},
      needsManual: false,
      manualOptions: const <String>[],
      manualTargetStatus: null,
      onManualStatusChanged: (_) {},
      onConfirm: onConfirm,
      onRescan: () {},
      onOpenDispatchCenter: onOpenDispatchCenter,
      onReportIncident: () {},
      isSubmitting: false,
      isDark: false,
      blockingReason: blockingReason,
    );
  }

  testWidgets('shows dispatch shortcut actions when batch is missing',
      (tester) async {
    var confirmCalls = 0;
    var openDispatchCalls = 0;
    await tester.pumpWidget(
      wrapWithMaterial(
        buildSheet(
          onConfirm: () => confirmCalls += 1,
          onOpenDispatchCenter: () => openDispatchCalls += 1,
          blockingReason: dispatchBatchRequiredMessage,
        ),
      ),
    );

    expect(find.text(dispatchBatchRequiredMessage), findsOneWidget);
    expect(find.text(batchRequiredBadgeLabel), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Confirm'), findsNothing);
    expect(find.text('Open Dispatch Center'), findsOneWidget);

    await tester.tap(find.text('Open Dispatch Center'));
    await tester.pumpAndSettle();
    expect(openDispatchCalls, 1);
    expect(confirmCalls, 0);
  });

  testWidgets('keeps confirm enabled when there is no blocking reason',
      (tester) async {
    var confirmCalls = 0;
    await tester.pumpWidget(
      wrapWithMaterial(
        buildSheet(
          onConfirm: () => confirmCalls += 1,
          onOpenDispatchCenter: () {},
        ),
      ),
    );

    final confirmButton = tester.widget<ElevatedButton>(
      find.widgetWithText(ElevatedButton, 'Confirm'),
    );
    expect(confirmButton.onPressed, isNotNull);

    await tester.tap(find.widgetWithText(ElevatedButton, 'Confirm'));
    await tester.pumpAndSettle();
    expect(confirmCalls, 1);
  });
}
