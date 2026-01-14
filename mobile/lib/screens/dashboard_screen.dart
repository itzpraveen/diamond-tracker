import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/models/enums.dart';
import 'package:diamond_tracker_mobile/screens/delivery_screen.dart';
import 'package:diamond_tracker_mobile/screens/dispatch_screen.dart';
import 'package:diamond_tracker_mobile/screens/factory_screen.dart';
import 'package:diamond_tracker_mobile/screens/incident_screen.dart';
import 'package:diamond_tracker_mobile/screens/lookup_screen.dart';
import 'package:diamond_tracker_mobile/screens/packing_screen.dart';
import 'package:diamond_tracker_mobile/screens/purchase_entry_screen.dart';
import 'package:diamond_tracker_mobile/screens/qc_stock_screen.dart';
import 'package:diamond_tracker_mobile/screens/scan_screen.dart';
import 'package:diamond_tracker_mobile/state/auth_controller.dart';
import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/ui/status_utils.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _loadingMetrics = false;
  bool _syncing = false;
  String? _loadError;
  DateTime? _lastRefresh;
  int? _offlineJobs;
  int? _pendingScans;
  final Map<String, int?> _metricCounts = {};

  @override
  void initState() {
    super.initState();
    _loadMetrics();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final role = authState.role;
    final roleLabel = _roleLabel(role);
    final metrics = _metricsForRole(role);

    return MajesticScaffold(
      title: 'Majestic Tracking',
      actions: [
        IconButton(
          icon: const Icon(Icons.logout),
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
        )
      ],
      padding: EdgeInsets.zero,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: MajesticColors.gold.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.shield, color: MajesticColors.forest),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Operational Overview', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          'Role: $roleLabel',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: MajesticColors.ink.withOpacity(0.6)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _lastRefresh == null
                              ? 'Tap refresh to load latest counts.'
                              : 'Updated ${_relativeTime(_lastRefresh)}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: MajesticColors.ink.withOpacity(0.5)),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: _loadingMetrics ? null : _loadMetrics,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _sectionLabel(context, 'Workload Snapshot'),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text('Queue Focus', style: Theme.of(context).textTheme.titleMedium),
                      ),
                      if (_loadingMetrics)
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                    ],
                  ),
                  if (_loadError != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _loadError!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: MajesticColors.danger),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: metrics
                        .map(
                          (metric) => _metricTile(
                            label: metric.label,
                            count: _metricCounts[metric.label],
                            color: metric.color ?? statusColor(metric.status),
                            statusLabelText: statusLabel(metric.status),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _sectionLabel(context, 'Sync Health'),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text('Offline Queue', style: Theme.of(context).textTheme.titleMedium),
                      ),
                      if (_syncing)
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _syncMetric(
                          label: 'Offline jobs',
                          count: _offlineJobs,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _syncMetric(
                          label: 'Queued scans',
                          count: _pendingScans,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.sync),
                      label: const Text('Sync Now'),
                      onPressed: _syncing ? null : _syncQueue,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _sectionLabel(context, 'Quick Actions'),
          const SizedBox(height: 8),
          _actionTile(
            context,
            icon: Icons.qr_code_scanner,
            title: 'Quick Scan',
            subtitle: 'Scan label to move to next status',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => role == Role.dispatch ? const DispatchScreen() : const ScanScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _actionTile(
            context,
            icon: Icons.search,
            title: 'Lookup / Search',
            subtitle: 'Find job details and timeline',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const LookupScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _actionTile(
            context,
            icon: Icons.report_gmailerrorred,
            title: 'Report Incident',
            subtitle: 'Mismatch, damage, duplicate scan',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const IncidentScreen()),
            ),
          ),
          const SizedBox(height: 20),
          _sectionLabel(context, 'Role Actions'),
          const SizedBox(height: 8),
          if (role == Role.purchase) _navTile(context, 'Purchase Entry', const PurchaseEntryScreen()),
          if (role == Role.packing) _navTile(context, 'Packing', const PackingScreen()),
          if (role == Role.dispatch) _navTile(context, 'Dispatch', const DispatchScreen()),
          if (role == Role.factory) _navTile(context, 'Factory', const FactoryScreen()),
          if (role == Role.qcStock) _navTile(context, 'QC / Stock', const QcStockScreen()),
          if (role == Role.delivery) _navTile(context, 'Delivery', const DeliveryScreen()),
        ],
      ),
    );
  }

  Future<void> _loadMetrics() async {
    setState(() {
      _loadingMetrics = true;
      _loadError = null;
    });
    final role = ref.read(authControllerProvider).role;
    final metrics = _metricsForRole(role);
    final db = ref.read(dbProvider);
    final api = ref.read(apiClientProvider);
    try {
      final offlineJobs = await db.offlineJobCount();
      final pendingScans = await db.pendingQueueCount();
      final entries = await Future.wait(metrics.map((metric) async {
        try {
          final jobs = await api.listJobs(
            status: metric.status,
            fromDate: metric.todayOnly ? _startOfToday() : null,
          );
          return MapEntry<String, int?>(metric.label, jobs.length);
        } catch (_) {
          return MapEntry<String, int?>(metric.label, null);
        }
      }));
      if (!mounted) return;
      setState(() {
        _offlineJobs = offlineJobs;
        _pendingScans = pendingScans;
        _metricCounts
          ..clear()
          ..addEntries(entries);
        _lastRefresh = DateTime.now();
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _loadError = 'Failed to refresh: $error');
    } finally {
      if (mounted) {
        setState(() => _loadingMetrics = false);
      }
    }
  }

  Future<void> _syncQueue() async {
    setState(() => _syncing = true);
    try {
      final report = await ref.read(syncServiceProvider).syncAll();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Sync done: ${report.jobsSynced} jobs, ${report.scansSynced} scans, ${report.failures} failures.',
          ),
        ),
      );
      await _loadMetrics();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sync failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _syncing = false);
      }
    }
  }

  Widget _sectionLabel(BuildContext context, String label) {
    return Text(
      label.toUpperCase(),
      style: Theme.of(context).textTheme.labelLarge?.copyWith(
            letterSpacing: 2.2,
            color: MajesticColors.ink.withOpacity(0.55),
          ),
    );
  }

  Widget _metricTile({
    required String label,
    required int? count,
    required Color color,
    required String statusLabelText,
  }) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            count?.toString() ?? '--',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(
            statusLabelText,
            style: TextStyle(fontSize: 11, color: MajesticColors.ink.withOpacity(0.5)),
          ),
        ],
      ),
    );
  }

  Widget _syncMetric({required String label, required int? count}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: MajesticColors.cloud,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
          const SizedBox(height: 6),
          Text(
            count?.toString() ?? '--',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
          ),
        ],
      ),
    );
  }

  Widget _actionTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: MajesticColors.forest.withOpacity(0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: MajesticColors.forest),
        ),
        title: Text(title, style: Theme.of(context).textTheme.titleMedium),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Widget _navTile(BuildContext context, String title, Widget screen) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        title: Text(title, style: Theme.of(context).textTheme.titleMedium),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
      ),
    );
  }

  DateTime _startOfToday() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }

  String _relativeTime(DateTime? timestamp) {
    if (timestamp == null) return '-';
    final diff = DateTime.now().difference(timestamp);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 30) return '${diff.inDays}d ago';
    return '${timestamp.year}-${timestamp.month.toString().padLeft(2, '0')}-${timestamp.day.toString().padLeft(2, '0')}';
  }

  List<_MetricSpec> _metricsForRole(Role? role) {
    switch (role) {
      case Role.purchase:
        return const [
          _MetricSpec(label: 'Today intake', status: 'PURCHASED', todayOnly: true, color: MajesticColors.gold),
          _MetricSpec(label: 'Awaiting pack', status: 'PURCHASED'),
        ];
      case Role.packing:
        return const [
          _MetricSpec(label: 'Awaiting pack', status: 'PURCHASED'),
          _MetricSpec(label: 'Ready for dispatch', status: 'PACKED_READY'),
        ];
      case Role.dispatch:
        return const [
          _MetricSpec(label: 'Ready for dispatch', status: 'PACKED_READY'),
          _MetricSpec(label: 'Dispatched', status: 'DISPATCHED_TO_FACTORY'),
        ];
      case Role.factory:
        return const [
          _MetricSpec(label: 'Inbound to factory', status: 'DISPATCHED_TO_FACTORY'),
          _MetricSpec(label: 'In workshop', status: 'RECEIVED_AT_FACTORY'),
        ];
      case Role.qcStock:
        return const [
          _MetricSpec(label: 'Awaiting QC', status: 'RETURNED_FROM_FACTORY'),
          _MetricSpec(label: 'Received at shop', status: 'RECEIVED_AT_SHOP'),
          _MetricSpec(label: 'In stock', status: 'ADDED_TO_STOCK'),
        ];
      case Role.delivery:
        return const [
          _MetricSpec(label: 'Out for delivery', status: 'HANDED_TO_DELIVERY'),
          _MetricSpec(label: 'Delivered', status: 'DELIVERED_TO_CUSTOMER'),
        ];
      case Role.admin:
      case null:
        return const [
          _MetricSpec(label: 'Ready for dispatch', status: 'PACKED_READY'),
          _MetricSpec(label: 'At factory', status: 'RECEIVED_AT_FACTORY'),
          _MetricSpec(label: 'Awaiting QC', status: 'RETURNED_FROM_FACTORY'),
          _MetricSpec(label: 'Out for delivery', status: 'HANDED_TO_DELIVERY'),
        ];
    }
  }

  String _roleLabel(Role? role) {
    switch (role) {
      case Role.purchase:
        return 'Purchase';
      case Role.packing:
        return 'Packing';
      case Role.dispatch:
        return 'Dispatch';
      case Role.factory:
        return 'Factory';
      case Role.qcStock:
        return 'QC / Stock';
      case Role.delivery:
        return 'Delivery';
      case Role.admin:
        return 'Admin';
      case null:
        return 'Unassigned';
    }
  }
}

class _MetricSpec {
  const _MetricSpec({
    required this.label,
    required this.status,
    this.todayOnly = false,
    this.color,
  });

  final String label;
  final String status;
  final bool todayOnly;
  final Color? color;
}
