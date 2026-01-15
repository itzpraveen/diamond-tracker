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
import 'package:diamond_tracker_mobile/widgets/form_fields.dart';
import 'package:diamond_tracker_mobile/widgets/loading_button.dart';
import 'package:diamond_tracker_mobile/widgets/scanner_overlay.dart';
import 'package:diamond_tracker_mobile/widgets/status_chip.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key, this.targetStatus, this.batchId, this.batchCode});

  final String? targetStatus;
  final String? batchId;
  final String? batchCode;

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen>
    with SingleTickerProviderStateMixin {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
  );

  bool _processing = false;
  String? _scannedCode;
  Map<String, dynamic>? _job;
  bool _offline = false;
  String? _manualTargetStatus;
  String? _errorMessage;
  bool _isSubmitting = false;
  bool _flashOn = false;

  late AnimationController _sheetAnimController;
  late Animation<Offset> _sheetAnimation;

  @override
  void initState() {
    super.initState();
    _sheetAnimController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _sheetAnimation = Tween<Offset>(
      begin: const Offset(0, 1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _sheetAnimController,
      curve: Curves.easeOutCubic,
    ));
  }

  @override
  void dispose() {
    _scannerController.dispose();
    _sheetAnimController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authControllerProvider).role;
    final currentStatus = _job?['current_status']?.toString();
    final nextStatus = widget.targetStatus ?? _manualTargetStatus ?? _nextStatus(role, currentStatus);
    final manualOptions = role == null ? <String>[] : _manualOptions(role);
    final needsManual = widget.targetStatus == null && manualOptions.length > 1;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ScannerScaffold(
      title: 'Scan',
      actions: [
        // Flash toggle
        IconButton(
          icon: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: _flashOn ? MajesticColors.gold : Colors.black.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _flashOn ? Icons.flash_on : Icons.flash_off,
              size: 18,
              color: _flashOn ? MajesticColors.ink : Colors.white,
            ),
          ),
          onPressed: () {
            _scannerController.toggleTorch();
            setState(() => _flashOn = !_flashOn);
          },
        ),
      ],
      body: Stack(
        children: [
          // Camera view
          MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
          ),

          // Scanner overlay
          ScannerOverlay(
            isProcessing: _processing,
            statusText: _processing ? 'Processing...' : null,
          ),

          // Result sheet
          if (_scannedCode != null)
            SlideTransition(
              position: _sheetAnimation,
              child: Align(
                alignment: Alignment.bottomCenter,
                child: _ResultSheet(
                  scannedCode: _scannedCode!,
                  job: _job,
                  error: _errorMessage,
                  currentStatus: currentStatus,
                  nextStatus: nextStatus,
                  batchCode: widget.batchCode,
                  offline: _offline,
                  onOfflineChanged: (v) => setState(() => _offline = v),
                  needsManual: needsManual,
                  manualOptions: manualOptions,
                  manualTargetStatus: _manualTargetStatus,
                  onManualStatusChanged: (v) => setState(() => _manualTargetStatus = v),
                  onConfirm: () => _confirmScan(context, role),
                  onRescan: _resetScan,
                  onReportIncident: () => Navigator.push(
                    context,
                    MajesticPageRoute(page: IncidentScreen(jobId: _scannedCode)),
                  ),
                  isSubmitting: _isSubmitting,
                  isDark: isDark,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_processing) return;
    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null) return;

    setState(() {
      _processing = true;
      _scannedCode = code;
      _errorMessage = null;
      _job = null;
      _manualTargetStatus = null;
    });

    // Show sheet
    _sheetAnimController.forward();

    final role = ref.read(authControllerProvider).role;
    final manualOptions = role == null ? <String>[] : _manualOptions(role);
    final needsManual = widget.targetStatus == null && manualOptions.length > 1;

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
            _errorMessage = 'Job not cached locally. Enable online mode or select a status manually.';
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
        _errorMessage = 'Failed to load job: $error';
      });
    }
  }

  Future<void> _confirmScan(BuildContext context, Role? role) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    if (_scannedCode == null || _isSubmitting) return;

    final nextStatus = widget.targetStatus ??
        _manualTargetStatus ??
        _nextStatus(role, _job?['current_status'] as String?);

    if (nextStatus == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No valid status transition')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

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
      if (!context.mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(_offline ? 'Scan queued for sync' : 'Scan confirmed'),
          backgroundColor: MajesticColors.success,
        ),
      );
      navigator.pop();
    } catch (error) {
      if (!context.mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Scan failed: $error'),
          backgroundColor: MajesticColors.danger,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _resetScan() {
    _sheetAnimController.reverse().then((_) {
      setState(() {
        _processing = false;
        _scannedCode = null;
        _job = null;
        _manualTargetStatus = null;
        _errorMessage = null;
      });
    });
  }

  String? _nextStatus(Role? role, String? currentStatus) {
    if (role == null) return null;
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
}

class _ResultSheet extends StatelessWidget {
  const _ResultSheet({
    required this.scannedCode,
    required this.job,
    required this.error,
    required this.currentStatus,
    required this.nextStatus,
    required this.batchCode,
    required this.offline,
    required this.onOfflineChanged,
    required this.needsManual,
    required this.manualOptions,
    required this.manualTargetStatus,
    required this.onManualStatusChanged,
    required this.onConfirm,
    required this.onRescan,
    required this.onReportIncident,
    required this.isSubmitting,
    required this.isDark,
  });

  final String scannedCode;
  final Map<String, dynamic>? job;
  final String? error;
  final String? currentStatus;
  final String? nextStatus;
  final String? batchCode;
  final bool offline;
  final ValueChanged<bool> onOfflineChanged;
  final bool needsManual;
  final List<String> manualOptions;
  final String? manualTargetStatus;
  final ValueChanged<String?> onManualStatusChanged;
  final VoidCallback onConfirm;
  final VoidCallback onRescan;
  final VoidCallback onReportIncident;
  final bool isSubmitting;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasError = error != null;
    final canConfirm = !hasError || offline;

    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? MajesticColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Job $scannedCode',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (batchCode != null)
                          Container(
                            margin: const EdgeInsets.only(top: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: MajesticColors.gold.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Batch $batchCode',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: MajesticColors.gold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (hasError && !offline)
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: MajesticColors.danger.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.error_outline,
                        color: MajesticColors.danger,
                        size: 20,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),

              // Content
              if (hasError && !offline)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: MajesticColors.danger.withValues(alpha: isDark ? 0.2 : 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: MajesticColors.danger.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber, color: MajesticColors.danger, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          error!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: MajesticColors.danger,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else if (job != null) ...[
                // Item description
                if (job!['item_description'] != null)
                  Text(
                    job!['item_description'].toString(),
                    style: theme.textTheme.bodyMedium,
                  ),
                const SizedBox(height: 16),

                // Status transition
                StatusTransition(
                  currentStatus: currentStatus,
                  nextStatus: nextStatus,
                ),

                // Holder info
                if (job!['current_holder_username'] != null ||
                    job!['current_holder_role'] != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 16,
                        color: isDark
                            ? MajesticColors.darkTextSecondary
                            : MajesticColors.ink.withValues(alpha: 0.5),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Last: ${job!['current_holder_username'] ?? job!['current_holder_role'] ?? '-'}',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ],
              ],

              const SizedBox(height: 16),

              // Offline toggle
              MajesticSwitch(
                title: 'Offline Mode',
                subtitle: offline ? 'Will queue for later sync' : 'Connected to server',
                icon: offline ? Icons.cloud_off : Icons.cloud_done,
                value: offline,
                onChanged: onOfflineChanged,
              ),

              // Manual status selector
              if (needsManual) ...[
                const SizedBox(height: 12),
                MajesticDropdown<String>(
                  label: 'Target Status',
                  value: manualTargetStatus,
                  items: manualOptions
                      .map((status) => DropdownMenuItem(
                            value: status,
                            child: Text(statusLabel(status)),
                          ))
                      .toList(),
                  onChanged: onManualStatusChanged,
                ),
              ],

              const SizedBox(height: 20),

              // Actions
              Row(
                children: [
                  Expanded(
                    child: LoadingButton(
                      onPressed: canConfirm ? onConfirm : null,
                      label: 'Confirm',
                      icon: Icons.check,
                      isLoading: isSubmitting,
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton(
                    onPressed: onRescan,
                    child: const Text('Rescan'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: onReportIncident,
                  icon: const Icon(Icons.report_gmailerrorred, size: 18),
                  label: const Text('Report Incident'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
