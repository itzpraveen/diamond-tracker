import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'package:diamond_tracker_mobile/models/enums.dart';
import 'package:diamond_tracker_mobile/state/auth_controller.dart';
import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key, this.targetStatus, this.batchId});

  final String? targetStatus;
  final String? batchId;

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

    return MajesticScaffold(
      title: 'Scan',
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Stack(
                  children: [
                    MobileScanner(
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
                    Positioned(
                      top: 16,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.4),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _processing ? 'Processing' : 'Ready to scan',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (_scannedCode != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Job $_scannedCode', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      Text(_job?['item_description'] ?? ''),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        value: _offline,
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Offline mode'),
                        onChanged: (v) => setState(() => _offline = v),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: role == null ? null : () => _confirmScan(context, role),
                          child: const Text('Confirm Next Status'),
                        ),
                      )
                    ],
                  ),
                ),
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
    final payload = <String, dynamic>{
      'to_status': nextStatus,
      'remarks': 'Mobile scan',
    };
    if (widget.batchId != null) {
      payload['batch_id'] = widget.batchId;
    }
    await repo.scanJob(
      _scannedCode!,
      payload,
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
