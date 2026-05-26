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
import 'package:diamond_tracker_mobile/screens/scan_logic.dart';
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

class _DashboardScreenState extends ConsumerState<DashboardScreen>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  static const Duration _metricsTimeout = Duration(seconds: 20);
  static const Duration _autoSyncCooldown = Duration(minutes: 1);

  bool _loadingMetrics = false;
  bool _syncing = false;
  String? _loadError;
  DateTime? _lastRefresh;
  int? _offlineJobs;
  int? _pendingScans;
  final Map<String, int?> _metricCounts = {};
  DateTime? _lastAutoSyncAttempt;

  late AnimationController _staggerController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _staggerController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _staggerController.forward();
    Future.microtask(() => _refreshDashboard(attemptAutoSync: true));
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _staggerController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_refreshDashboard(attemptAutoSync: true));
    }
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
          onPressed: () => _confirmLogout(context),
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
            _staggeredItem(
              index: 0,
              total: 5,
              child: _HeaderCard(
                roleLabel: roleLabel,
                lastRefresh: _lastRefresh,
                isLoading: _loadingMetrics,
                onRefresh: _loadMetrics,
                isDark: isDark,
              ),
            ),
            const SizedBox(height: 20),

            // Metrics section
            _staggeredItem(
              index: 1,
              total: 5,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                          icon: metric.icon,
                          color: metric.color ?? statusColor(metric.status),
                        );
                      }).toList(),
                      isLoading: _loadingMetrics,
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Sync status
            _staggeredItem(
              index: 2,
              total: 5,
              child: SyncStatusCard(
                key: const Key('dashboard_sync_status'),
                offlineJobs: _offlineJobs,
                pendingScans: _pendingScans,
                onSync: _syncQueue,
                isSyncing: _syncing,
                lastSyncTime: _lastRefresh,
              ),
            ),
            const SizedBox(height: 24),

            // Quick actions
            _staggeredItem(
              index: 3,
              total: 5,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Quick Actions'),
                  ActionCard(
                    title: 'Quick Scan',
                    subtitle: roles.contains(Role.dispatch) ||
                            roles.contains(Role.factory) ||
                            roles.contains(Role.qcStock) ||
                            roles.contains(Role.admin)
                        ? 'Open Voucher Center for bulk scanning'
                        : 'Scan to move to next status',
                    icon: Icons.qr_code_scanner,
                    isPrimary: true,
                    onTap: () => _navigateTo(
                      context,
                      roles.contains(Role.dispatch) ||
                              roles.contains(Role.factory) ||
                              roles.contains(Role.qcStock) ||
                              roles.contains(Role.admin)
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
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Role-specific actions
            if (roleActions.isNotEmpty)
              _staggeredItem(
                index: 4,
                total: 5,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionHeader(title: 'Your Workspace'),
                    for (final action in roleActions) ...[
                      action,
                      const SizedBox(height: 12),
                    ],
                  ],
                ),
              ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  List<Widget> _roleActions(BuildContext context, List<Role> roles) {
    final actions = <Widget>[];
    final seen = <Role>{};
    final hasVoucherWorkspace = roles.contains(Role.dispatch) ||
        roles.contains(Role.factory) ||
        roles.contains(Role.qcStock) ||
        roles.contains(Role.admin);
    if (hasVoucherWorkspace) {
      actions.add(
        RoleActionButton(
          title: 'Voucher Center',
          subtitle: 'Bulk issue, receive, and route items',
          icon: Icons.route_outlined,
          onTap: () => _navigateTo(context, const DispatchScreen()),
        ),
      );
    }
    for (final role in roles) {
      if (role == Role.dispatch || role == Role.admin) {
        continue;
      }
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
        return null;
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

  Widget _staggeredItem(
      {required int index, required int total, required Widget child}) {
    final start = (index / total).clamp(0.0, 1.0);
    final end = ((index + 1.5) / total).clamp(0.0, 1.0);
    final curve = Interval(start, end, curve: Curves.easeOutCubic);

    final fadeAnim = CurvedAnimation(parent: _staggerController, curve: curve);
    final slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(fadeAnim);

    return FadeTransition(
      opacity: fadeAnim,
      child: SlideTransition(
        position: slideAnim,
        child: child,
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context) async {
    final confirmed = await showMajesticDialog<bool>(
      context: context,
      title: 'Sign Out',
      content: const Text(
        'Are you sure you want to sign out? Any unsynced data will be preserved for your next session.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, true),
          child: const Text('Sign Out'),
        ),
      ],
    );
    if (confirmed == true && mounted) {
      ref.read(authControllerProvider.notifier).logout();
    }
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
      final pendingScans =
          await db.pendingQueueCount().timeout(_metricsTimeout);
      final entries = <MapEntry<String, int?>>[];
      String? metricsFailureMessage;
      Future<void> addMetricEntries(
          List<_MetricSpec> group, DateTime? fromDate) async {
        if (group.isEmpty) return;
        try {
          final statuses =
              group.map((metric) => metric.status).toSet().toList();
          final counts = await api
              .jobMetrics(statuses: statuses, fromDate: fromDate)
              .timeout(_metricsTimeout);
          for (final metric in group) {
            entries.add(MapEntry<String, int?>(
                metric.label, counts[metric.status] ?? 0));
          }
        } catch (error) {
          if (isUnauthorizedError(error)) {
            rethrow;
          }
          metricsFailureMessage ??= readableApiError(error);
          // Fallback: query each metric independently. This avoids list-query
          // serialization issues where grouped status filters can fail.
          for (final metric in group) {
            try {
              final singleCounts = await api.jobMetrics(
                  statuses: [metric.status],
                  fromDate: fromDate).timeout(_metricsTimeout);
              entries.add(MapEntry<String, int?>(
                  metric.label, singleCounts[metric.status] ?? 0));
            } catch (_) {
              entries.add(MapEntry<String, int?>(metric.label, null));
            }
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
        if (entries.isNotEmpty &&
            entries.every((entry) => entry.value == null)) {
          _loadError =
              'Metrics unavailable: ${metricsFailureMessage ?? 'request failed'}';
        } else {
          _loadError = null;
        }
        _lastRefresh = DateTime.now();
      });
    } on TimeoutException {
      if (!mounted) return;
      setState(() => _loadError = 'Refresh timed out. Pull to retry.');
    } catch (error) {
      if (!mounted) return;
      if (isUnauthorizedError(error)) {
        await ref.read(authControllerProvider.notifier).logout();
        return;
      }
      setState(
          () => _loadError = 'Failed to refresh: ${readableApiError(error)}');
    } finally {
      if (mounted) {
        setState(() => _loadingMetrics = false);
      }
    }
  }

  Future<void> _refreshDashboard({bool attemptAutoSync = false}) async {
    await _loadMetrics();
    if (!attemptAutoSync || !mounted || _syncing) {
      return;
    }
    final queuedItems = (_offlineJobs ?? 0) + (_pendingScans ?? 0);
    if (queuedItems == 0) {
      return;
    }
    final now = DateTime.now();
    if (_lastAutoSyncAttempt != null &&
        now.difference(_lastAutoSyncAttempt!) < _autoSyncCooldown) {
      return;
    }
    _lastAutoSyncAttempt = now;
    await _syncQueue(triggeredByResume: true);
  }

  Future<void> _syncQueue({bool triggeredByResume = false}) async {
    if (_syncing) {
      return;
    }
    setState(() => _syncing = true);
    try {
      final report = await ref.read(syncServiceProvider).syncAll();
      if (!mounted) return;
      final syncedAnything = report.jobsSynced > 0 ||
          report.scansSynced > 0 ||
          report.failures > 0;
      if (!triggeredByResume || syncedAnything) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              triggeredByResume
                  ? 'Auto-sync: ${report.jobsSynced} jobs, ${report.scansSynced} scans, ${report.failures} failures'
                  : 'Sync complete: ${report.jobsSynced} jobs, ${report.scansSynced} scans, ${report.failures} failures',
            ),
          ),
        );
      }
      await _loadMetrics();
    } catch (error) {
      if (!mounted) return;
      if (isUnauthorizedError(error)) {
        await ref.read(authControllerProvider.notifier).logout();
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sync failed: ${readableApiError(error)}')),
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
          _MetricSpec(
              label: 'Today intake',
              status: 'PURCHASED',
              todayOnly: true,
              color: MajesticColors.gold,
              icon: Icons.add_circle_outline),
          _MetricSpec(
              label: 'Awaiting pack',
              status: 'PURCHASED',
              icon: Icons.inventory_2_outlined),
        ];
      case Role.packing:
        return const [
          _MetricSpec(
              label: 'Awaiting pack',
              status: 'PURCHASED',
              icon: Icons.inventory_2_outlined),
          _MetricSpec(
              label: 'Ready for delivery',
              status: 'PACKED_READY',
              icon: Icons.check_circle_outline),
        ];
      case Role.dispatch:
        return const [
          _MetricSpec(
              label: 'Ready for delivery',
              status: 'PACKED_READY',
              icon: Icons.check_circle_outline),
          _MetricSpec(
              label: 'Dispatched',
              status: 'DISPATCHED_TO_FACTORY',
              icon: Icons.local_shipping_outlined),
        ];
      case Role.factory:
        return const [
          _MetricSpec(
              label: 'Inbound',
              status: 'DISPATCHED_TO_FACTORY',
              icon: Icons.move_to_inbox_outlined),
          _MetricSpec(
              label: 'In workshop',
              status: 'RECEIVED_AT_FACTORY',
              icon: Icons.precision_manufacturing_outlined),
        ];
      case Role.qcStock:
        return const [
          _MetricSpec(
              label: 'Awaiting QC',
              status: 'RETURNED_FROM_FACTORY',
              icon: Icons.rule_outlined),
          _MetricSpec(
              label: 'At shop',
              status: 'RECEIVED_AT_SHOP',
              icon: Icons.storefront_outlined),
          _MetricSpec(
              label: 'In stock', status: 'ADDED_TO_STOCK', icon: Icons.shelves),
        ];
      case Role.delivery:
        return const [
          _MetricSpec(
              label: 'Out for delivery',
              status: 'HANDED_TO_DELIVERY',
              icon: Icons.delivery_dining_outlined),
          _MetricSpec(
              label: 'Delivered',
              status: 'DELIVERED_TO_CUSTOMER',
              icon: Icons.task_alt),
        ];
      case Role.admin:
        return const [
          _MetricSpec(
              label: 'Ready for delivery',
              status: 'PACKED_READY',
              icon: Icons.check_circle_outline),
          _MetricSpec(
              label: 'At factory',
              status: 'RECEIVED_AT_FACTORY',
              icon: Icons.factory_outlined),
          _MetricSpec(
              label: 'Awaiting QC',
              status: 'RETURNED_FROM_FACTORY',
              icon: Icons.rule_outlined),
          _MetricSpec(
              label: 'Delivering',
              status: 'HANDED_TO_DELIVERY',
              icon: Icons.delivery_dining_outlined),
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
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
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
                          color: isDark
                              ? MajesticColors.gold
                              : MajesticColors.forest,
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
                          color: isDark
                              ? MajesticColors.gold
                              : MajesticColors.forest,
                        ),
                      )
                    : Icon(
                        Icons.refresh,
                        color: isDark
                            ? MajesticColors.gold
                            : MajesticColors.forest,
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
    this.icon,
  });

  final String label;
  final String status;
  final bool todayOnly;
  final Color? color;
  final IconData? icon;
}
