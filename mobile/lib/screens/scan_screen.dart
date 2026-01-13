import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'package:diamond_tracker_mobile/models/enums.dart';
import 'package:diamond_tracker_mobile/state/auth_controller.dart';
import 'package:diamond_tracker_mobile/state/providers.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key, this.targetStatus});

  final String? targetStatus;

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  bool _processing = false;
  String? _scannedCode;
  Map<String, dynamic>? _job;
  bool _offline = false;

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authControllerProvider).role;

    return Scaffold(
      appBar: AppBar(title: const Text('Scan')),
      body: Column(
        children: [
          Expanded(
            child: MobileScanner(
              onDetect: (capture) async {
                if (_processing) return;
                final code = capture.barcodes.first.rawValue;
                if (code == null) return;
                setState(() {
                  _processing = true;
                  _scannedCode = code;
                });
                final api = ref.read(apiClientProvider);
                final job = await api.getJob(code);
                setState(() {
                  _job = job;
                });
              },
            ),
          ),
          if (_scannedCode != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Job: $_scannedCode', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(_job?['item_description'] ?? ''),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Switch(value: _offline, onChanged: (v) => setState(() => _offline = v)),
                      const Text('Offline mode')
                    ],
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: role == null ? null : () => _confirmScan(context, role),
                    child: const Text('Confirm Next Status'),
                  )
                ],
              ),
            )
        ],
      ),
    );
  }

  Future<void> _confirmScan(BuildContext context, Role role) async {
    final job = _job;
    if (job == null || _scannedCode == null) return;
    final nextStatus = widget.targetStatus ?? _nextStatus(role, job['current_status'] as String?);
    if (nextStatus == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No valid transition')));
      return;
    }
    final repo = ref.read(jobRepositoryProvider);
    await repo.scanJob(
      _scannedCode!,
      {
        'to_status': nextStatus,
        'remarks': 'Mobile scan',
      },
      offline: _offline,
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Scan submitted')));
    Navigator.pop(context);
  }

  String? _nextStatus(Role role, String? currentStatus) {
    switch (role) {
      case Role.packing:
        return 'PACKED_READY';
      case Role.dispatch:
        return 'DISPATCHED_TO_FACTORY';
      case Role.factory:
        if (currentStatus == 'DISPATCHED_TO_FACTORY') return 'RECEIVED_AT_FACTORY';
        if (currentStatus == 'RECEIVED_AT_FACTORY') return 'RETURNED_FROM_FACTORY';
        return null;
      case Role.qcStock:
        if (currentStatus == 'RETURNED_FROM_FACTORY') return 'RECEIVED_AT_SHOP';
        return 'ADDED_TO_STOCK';
      case Role.delivery:
        return 'DELIVERED_TO_CUSTOMER';
      case Role.purchase:
        return 'PACKED_READY';
      case Role.admin:
        return null;
    }
  }
}
