import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/app.dart';
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
import 'package:diamond_tracker_mobile/widgets/action_card.dart';
import 'package:diamond_tracker_mobile/widgets/metric_card.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  static const Duration _metricsTimeout = Duration(seconds: 20);

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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final roles = authState.roles;
    final roleLabel = _rolesLabel(roles);
    final metrics = _metricsForRoles(roles);
    final roleActions = _roleActions(context, roles);

    return MajesticScaffold(
      title: 'Majestic Tracking',
      showBackButton: false,
      actions: [
        // Theme toggle
        IconButton(
          icon: Icon(
            isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            color: isDark ? MajesticColors.gold : MajesticColors.forest,
          ),
          onPressed: () => ref.read(themeModeProvider.notifier).toggleTheme(),
          tooltip: isDark ? 'Switch to light mode' : 'Switch to dark mode',
        ),
        // Logout
        IconButton(
          icon: const Icon(Icons.logout),
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          tooltip: 'Sign out',
        ),
      ],
      padding: EdgeInsets.zero,
      child: RefreshIndicator(
        onRefresh: _loadMetrics,
        color: theme.colorScheme.primary,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Header card
            _HeaderCard(
              roleLabel: roleLabel,
              lastRefresh: _lastRefresh,
              isLoading: _loadingMetrics,
              onRefresh: _loadMetrics,
              isDark: isDark,
            ),
            const SizedBox(height: 20),

            // Metrics section
            SectionHeader(
              key: const Key('dashboard_workload'),
              title: 'Workload',
              action: _loadError != null ? 'Retry' : null,
              onActionTap: _loadError != null ? _loadMetrics : null,
            ),
            if (_loadError != null)
              _ErrorCard(message: _loadError!, isDark: isDark)
            else
              MetricGrid(
                metrics: metrics.map((metric) {
                  return MetricCardData(
                    label: metric.label,
                    value: _metricCounts[metric.label]?.toString(),
                    subtitle: statusLabel(metric.status),
                    color: metric.color ?? statusColor(metric.status),
                  );
                }).toList(),
                isLoading: _loadingMetrics,
              ),
            const SizedBox(height: 24),

            // Sync status
            SyncStatusCard(
              key: const Key('dashboard_sync_status'),
              offlineJobs: _offlineJobs,
              pendingScans: _pendingScans,
              onSync: _syncQueue,
              isSyncing: _syncing,
              lastSyncTime: _lastRefresh,
            ),
            const SizedBox(height: 24),

            // Quick actions
            const SectionHeader(title: 'Quick Actions'),
            ActionCard(
              title: 'Quick Scan',
              subtitle: 'Scan to move to next status',
              icon: Icons.qr_code_scanner,
              isPrimary: true,
              onTap: () => _navigateTo(
                context,
                roles.length == 1 && roles.contains(Role.dispatch)
                    ? const DispatchScreen()
                    : const ScanScreen(),
              ),
            ),
            const SizedBox(height: 12),
            ActionCard(
              title: 'Lookup / Search',
              subtitle: 'Find job details and timeline',
              icon: Icons.search,
              onTap: () => _navigateTo(context, const LookupScreen()),
            ),
            const SizedBox(height: 12),
            ActionCard(
              title: 'Report Incident',
              subtitle: 'Mismatch, damage, or duplicate',
              icon: Icons.report_gmailerrorred,
              iconColor: MajesticColors.warning,
              onTap: () => _navigateTo(context, const IncidentScreen()),
            ),
            const SizedBox(height: 24),

            // Role-specific actions
            if (roleActions.isNotEmpty) ...[
              const SectionHeader(title: 'Your Workspace'),
              Column(
                children: [
                  for (final action in roleActions) ...[
                    action,
                    const SizedBox(height: 12),
                  ]
                ],
              ),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  List<Widget> _roleActions(BuildContext context, List<Role> roles) {
    final actions = <Widget>[];
    final seen = <Role>{};
    for (final role in roles) {
      if (seen.contains(role)) continue;
      seen.add(role);
      final action = _roleAction(context, role);
      if (action != null) {
        actions.add(action);
      }
    }
    return actions;
  }

  Widget? _roleAction(BuildContext context, Role role) {
    switch (role) {
      case Role.purchase:
        return RoleActionButton(
          title: 'Purchase Entry',
          subtitle: 'Create new job intake',
          icon: Icons.add_shopping_cart,
          color: MajesticColors.gold,
          onTap: () => _navigateTo(context, const PurchaseEntryScreen()),
        );
      case Role.packing:
        return RoleActionButton(
          title: 'Packing Station',
          subtitle: 'Pack items for dispatch',
          icon: Icons.inventory_2_outlined,
          onTap: () => _navigateTo(context, const PackingScreen()),
        );
      case Role.dispatch:
        return RoleActionButton(
          title: 'Dispatch Center',
          subtitle: 'Manage batches and dispatch',
          icon: Icons.local_shipping_outlined,
          onTap: () => _navigateTo(context, const DispatchScreen()),
        );
      case Role.factory:
        return RoleActionButton(
          title: 'Factory Workflow',
          subtitle: 'Receive and return items',
          icon: Icons.factory_outlined,
          onTap: () => _navigateTo(context, const FactoryScreen()),
        );
      case Role.qcStock:
        return RoleActionButton(
          title: 'QC / Stock',
          subtitle: 'Quality check and stock management',
          icon: Icons.verified_outlined,
          onTap: () => _navigateTo(context, const QcStockScreen()),
        );
      case Role.delivery:
        return RoleActionButton(
          title: 'Delivery',
          subtitle: 'Confirm customer deliveries',
          icon: Icons.delivery_dining_outlined,
          color: MajesticColors.success,
          onTap: () => _navigateTo(context, const DeliveryScreen()),
        );
      case Role.admin:
        return null;
    }
  }

  void _navigateTo(BuildContext context, Widget screen) {
    Navigator.push(context, MajesticPageRoute(page: screen));
  }

  Future<void> _loadMetrics() async {
    setState(() {
      _loadingMetrics = true;
      _loadError = null;
    });
    final roles = ref.read(authControllerProvider).roles;
    final metrics = _metricsForRoles(roles);
    final db = ref.read(dbProvider);
    final api = ref.read(apiClientProvider);
    try {
      final offlineJobs = await db.offlineJobCount().timeout(_metricsTimeout);
      final pendingScans = await db.pendingQueueCount().timeout(_metricsTimeout);
      final entries = <MapEntry<String, int?>>[];
      Future<void> addMetricEntries(List<_MetricSpec> group, DateTime? fromDate) async {
        if (group.isEmpty) return;
        try {
          final statuses = group.map((metric) => metric.status).toSet().toList();
          final counts = await api
              .jobMetrics(statuses: statuses, fromDate: fromDate)
              .timeout(_metricsTimeout);
          for (final metric in group) {
            entries.add(MapEntry<String, int?>(metric.label, counts[metric.status] ?? 0));
          }
        } catch (_) {
          for (final metric in group) {
            entries.add(MapEntry<String, int?>(metric.label, null));
          }
        }
      }

      final todayMetrics = metrics.where((metric) => metric.todayOnly).toList();
      final allMetrics = metrics.where((metric) => !metric.todayOnly).toList();
      await addMetricEntries(todayMetrics, _startOfToday());
      await addMetricEntries(allMetrics, null);
      if (!mounted) return;
      setState(() {
        _offlineJobs = offlineJobs;
        _pendingScans = pendingScans;
        _metricCounts
          ..clear()
          ..addEntries(entries);
        _lastRefresh = DateTime.now();
      });
    } on TimeoutException {
      if (!mounted) return;
      setState(() => _loadError = 'Refresh timed out. Pull to retry.');
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
            'Sync complete: ${report.jobsSynced} jobs, ${report.scansSynced} scans, ${report.failures} failures',
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

  DateTime _startOfToday() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }

  List<_MetricSpec> _metricsForRoles(List<Role> roles) {
    final Map<String, _MetricSpec> metrics = {};
    for (final role in roles) {
      for (final metric in _metricsForRole(role)) {
        metrics.putIfAbsent(metric.label, () => metric);
      }
    }
    return metrics.values.toList();
  }

  List<_MetricSpec> _metricsForRole(Role role) {
    switch (role) {
      case Role.purchase:
        return const [
          _MetricSpec(label: 'Today intake', status: 'PURCHASED', todayOnly: true, color: MajesticColors.gold),
          _MetricSpec(label: 'Awaiting pack', status: 'PURCHASED'),
        ];
      case Role.packing:
        return const [
          _MetricSpec(label: 'Awaiting pack', status: 'PURCHASED'),
          _MetricSpec(label: 'Ready for delivery', status: 'PACKED_READY'),
        ];
      case Role.dispatch:
        return const [
          _MetricSpec(label: 'Ready for delivery', status: 'PACKED_READY'),
          _MetricSpec(label: 'Dispatched', status: 'DISPATCHED_TO_FACTORY'),
        ];
      case Role.factory:
        return const [
          _MetricSpec(label: 'Inbound', status: 'DISPATCHED_TO_FACTORY'),
          _MetricSpec(label: 'In workshop', status: 'RECEIVED_AT_FACTORY'),
        ];
      case Role.qcStock:
        return const [
          _MetricSpec(label: 'Awaiting QC', status: 'RETURNED_FROM_FACTORY'),
          _MetricSpec(label: 'At shop', status: 'RECEIVED_AT_SHOP'),
          _MetricSpec(label: 'In stock', status: 'ADDED_TO_STOCK'),
        ];
      case Role.delivery:
        return const [
          _MetricSpec(label: 'Out for delivery', status: 'HANDED_TO_DELIVERY'),
          _MetricSpec(label: 'Delivered', status: 'DELIVERED_TO_CUSTOMER'),
        ];
      case Role.admin:
        return const [
          _MetricSpec(label: 'Ready for delivery', status: 'PACKED_READY'),
          _MetricSpec(label: 'At factory', status: 'RECEIVED_AT_FACTORY'),
          _MetricSpec(label: 'Awaiting QC', status: 'RETURNED_FROM_FACTORY'),
          _MetricSpec(label: 'Delivering', status: 'HANDED_TO_DELIVERY'),
        ];
    }
  }

  String _rolesLabel(List<Role> roles) {
    if (roles.isEmpty) return 'Unassigned';
    return roles.map(_roleLabel).join(', ');
  }

  String _roleLabel(Role role) {
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
    }
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({
    required this.roleLabel,
    required this.lastRefresh,
    required this.isLoading,
    required this.onRefresh,
    required this.isDark,
  });

  final String roleLabel;
  final DateTime? lastRefresh;
  final bool isLoading;
  final VoidCallback onRefresh;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  MajesticColors.darkCard,
                  MajesticColors.darkSurface,
                ]
              : [
                  MajesticColors.forest.withValues(alpha: 0.08),
                  MajesticColors.gold.withValues(alpha: 0.05),
                ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? MajesticColors.darkBorder
              : MajesticColors.forest.withValues(alpha: 0.1),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: isDark
                  ? MajesticColors.gold.withValues(alpha: 0.2)
                  : MajesticColors.forest.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              Icons.shield_outlined,
              color: isDark ? MajesticColors.gold : MajesticColors.forest,
              size: 26,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Operational Overview',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isDark
                            ? MajesticColors.gold.withValues(alpha: 0.2)
                            : MajesticColors.forest.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        roleLabel,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isDark ? MajesticColors.gold : MajesticColors.forest,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      lastRefresh == null
                          ? 'Pull to refresh'
                          : _formatTime(lastRefresh!),
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ],
            ),
          ),
          Material(
            color: isDark
                ? MajesticColors.darkSurface
                : Colors.white.withValues(alpha: 0.8),
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              onTap: isLoading ? null : onRefresh,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                child: isLoading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: isDark ? MajesticColors.gold : MajesticColors.forest,
                        ),
                      )
                    : Icon(
                        Icons.refresh,
                        color: isDark ? MajesticColors.gold : MajesticColors.forest,
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.isDark});

  final String message;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MajesticColors.danger.withValues(alpha: isDark ? 0.2 : 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: MajesticColors.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: MajesticColors.danger),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: MajesticColors.danger),
            ),
          ),
        ],
      ),
    );
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
