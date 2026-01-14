import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'package:diamond_tracker_mobile/models/enums.dart';
import 'package:diamond_tracker_mobile/screens/incident_screen.dart';
import 'package:diamond_tracker_mobile/state/auth_controller.dart';
import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/ui/status_utils.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key, this.targetStatus, this.batchId, this.batchCode});

  final String? targetStatus;
  final String? batchId;
  final String? batchCode;

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  bool _processing = false;
  String? _scannedCode;
  Map<String, dynamic>? _job;
  bool _offline = false;
  String? _manualTargetStatus;
  String? _errorMessage;

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authControllerProvider).role;
    final currentStatus = _job?['current_status']?.toString();
    final nextStatus = widget.targetStatus ?? _manualTargetStatus ?? _nextStatus(role, currentStatus);
    final manualOptions = role == null ? <String>[] : _manualOptions(role);
    final needsManual = widget.targetStatus == null && manualOptions.length > 1;

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
                          _errorMessage = null;
                          _job = null;
                          _manualTargetStatus = null;
                        });
                        try {
                          if (_offline) {
                            final repo = ref.read(jobRepositoryProvider);
                            final localJob = await repo.getLocalJob(code);
                            final fallback = role == null ? null : _nextStatus(role, localJob?['current_status'] as String?);
                            setState(() {
                              _job = localJob;
                              if (needsManual && _manualTargetStatus == null && fallback != null) {
                                _manualTargetStatus = fallback;
                              }
                              if (localJob == null) {
                                _errorMessage = 'Job not cached. Select a status to continue.';
                              }
                            });
                            return;
                          }
                          final api = ref.read(apiClientProvider);
                          final job = await api.getJob(code);
                          final fallback = role == null ? null : _nextStatus(role, job['current_status'] as String?);
                          setState(() {
                            _job = job;
                            if (needsManual && _manualTargetStatus == null && fallback != null) {
                              _manualTargetStatus = fallback;
                            }
                          });
                        } catch (error) {
                          setState(() {
                            _errorMessage = 'Unable to load job: $error';
                          });
                        }
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
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Job $_scannedCode', style: Theme.of(context).textTheme.titleMedium),
                          if (widget.batchCode != null)
                            _chip('Batch ${widget.batchCode}', MajesticColors.gold.withOpacity(0.2)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (_job != null) ...[
                        Text(_job?['item_description'] ?? ''),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _statusPill('Current', currentStatus),
                            const SizedBox(width: 8),
                            _statusPill('Next', nextStatus),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _job?['current_holder_username'] != null
                              ? 'Last handled by ${_job?['current_holder_username']} (${_job?['current_holder_role']})'
                              : 'Last handled by ${_job?['current_holder_role'] ?? '-'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Last scan: ${_job?['last_scan_at'] ?? '-'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ] else
                        Text(
                          _errorMessage ?? 'Scan to continue.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: MajesticColors.danger),
                        ),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        value: _offline,
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Offline mode'),
                        onChanged: (v) => setState(() => _offline = v),
                      ),
                      if (needsManual) ...[
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: _manualTargetStatus,
                          decoration: const InputDecoration(labelText: 'Select status'),
                          items: manualOptions
                              .map((status) => DropdownMenuItem(
                                    value: status,
                                    child: Text(statusLabel(status)),
                                  ))
                              .toList(),
                          onChanged: (value) => setState(() => _manualTargetStatus = value),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: role == null || nextStatus == null || (!_offline && _job == null)
                                  ? null
                                  : () => _confirmScan(context, role),
                              child: Text('Confirm ${statusLabel(nextStatus)}'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          OutlinedButton(
                            onPressed: _resetScan,
                            child: const Text('Rescan'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => IncidentScreen(jobId: _scannedCode)),
                        ),
                        icon: const Icon(Icons.report_gmailerrorred),
                        label: const Text('Report Incident'),
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
    if (_scannedCode == null) return;
    final nextStatus = widget.targetStatus ??
        _manualTargetStatus ??
        _nextStatus(role, _job?['current_status'] as String?);
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
    try {
      await repo.scanJob(
        _scannedCode!,
        payload,
        offline: _offline,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_offline ? 'Scan queued for sync' : 'Scan submitted')),
      );
      Navigator.pop(context);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Scan failed: $error')),
      );
    }
  }

  void _resetScan() {
    setState(() {
      _processing = false;
      _scannedCode = null;
      _job = null;
      _manualTargetStatus = null;
      _errorMessage = null;
    });
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
        if (currentStatus == 'RECEIVED_AT_SHOP') return 'ADDED_TO_STOCK';
        return null;
      case Role.delivery:
        return 'DELIVERED_TO_CUSTOMER';
      case Role.purchase:
        return null;
      case Role.admin:
        return null;
    }
  }

  List<String> _manualOptions(Role role) {
    switch (role) {
      case Role.factory:
        return ['RECEIVED_AT_FACTORY', 'RETURNED_FROM_FACTORY'];
      case Role.qcStock:
        return ['RECEIVED_AT_SHOP', 'ADDED_TO_STOCK', 'HANDED_TO_DELIVERY'];
      case Role.packing:
        return ['PACKED_READY'];
      case Role.dispatch:
        return ['DISPATCHED_TO_FACTORY'];
      case Role.delivery:
        return ['DELIVERED_TO_CUSTOMER'];
      case Role.purchase:
      case Role.admin:
        return [];
    }
  }

  Widget _statusPill(String label, String? status) {
    final color = statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        '$label: ${statusLabel(status)}',
        style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12),
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}
