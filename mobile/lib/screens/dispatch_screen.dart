import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:diamond_tracker_mobile/models/enums.dart';
import 'package:diamond_tracker_mobile/screens/scan_screen.dart';
import 'package:diamond_tracker_mobile/state/auth_controller.dart';
import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/widgets/action_card.dart';
import 'package:diamond_tracker_mobile/widgets/form_fields.dart';
import 'package:diamond_tracker_mobile/widgets/loading_button.dart';

String _formatBatchStatus(String? status) {
  if (status == null || status.isEmpty) {
    return '-';
  }
  return status
      .split('_')
      .map((part) =>
          part.isEmpty ? part : '${part[0]}${part.substring(1).toLowerCase()}')
      .join(' ');
}

String _formatBatchDateTime(BuildContext context, Object? value) {
  if (value == null) {
    return '-';
  }
  final parsed = DateTime.tryParse(value.toString());
  if (parsed == null) {
    return '-';
  }
  final localizations = MaterialLocalizations.of(context);
  final dateLabel = localizations.formatMediumDate(parsed);
  final timeLabel = localizations.formatTimeOfDay(
    TimeOfDay.fromDateTime(parsed),
    alwaysUse24HourFormat: MediaQuery.of(context).alwaysUse24HourFormat,
  );
  return '$dateLabel, $timeLabel';
}

class _VoucherRoute {
  const _VoucherRoute({
    required this.key,
    required this.title,
    required this.subtitle,
    required this.voucherType,
    required this.sourceRole,
    required this.destinationRole,
    required this.sourceLabel,
    required this.destinationLabel,
    required this.targetStatus,
    required this.icon,
    this.requiresFactory = false,
  });

  final String key;
  final String title;
  final String subtitle;
  final String voucherType;
  final String sourceRole;
  final String destinationRole;
  final String sourceLabel;
  final String destinationLabel;
  final String targetStatus;
  final IconData icon;
  final bool requiresFactory;
}

const List<_VoucherRoute> _voucherRoutes = [
  _VoucherRoute(
    key: 'dispatch_factory',
    title: 'Issue to Factory',
    subtitle: 'Present Location to Factory',
    voucherType: 'ISSUE',
    sourceRole: 'Dispatch',
    destinationRole: 'Factory',
    sourceLabel: 'Present Location',
    destinationLabel: 'Factory',
    targetStatus: 'DISPATCHED_TO_FACTORY',
    icon: Icons.local_shipping_outlined,
    requiresFactory: true,
  ),
  _VoucherRoute(
    key: 'factory_receipt',
    title: 'Receive at Factory',
    subtitle: 'Present Location to Factory',
    voucherType: 'RECEIPT',
    sourceRole: 'Dispatch',
    destinationRole: 'Factory',
    sourceLabel: 'Present Location',
    destinationLabel: 'Factory',
    targetStatus: 'RECEIVED_AT_FACTORY',
    icon: Icons.factory_outlined,
    requiresFactory: true,
  ),
  _VoucherRoute(
    key: 'factory_return_receipt',
    title: 'Receive from Factory',
    subtitle: 'Factory to Present Location',
    voucherType: 'RECEIPT',
    sourceRole: 'Factory',
    destinationRole: 'QC_Stock',
    sourceLabel: 'Factory',
    destinationLabel: 'Present Location',
    targetStatus: 'RECEIVED_AT_SHOP',
    icon: Icons.move_to_inbox_outlined,
    requiresFactory: true,
  ),
  _VoucherRoute(
    key: 'qc_stock',
    title: 'QC to Stock',
    subtitle: 'Quality Control to Stock/Storage',
    voucherType: 'MOVEMENT',
    sourceRole: 'QC_Stock',
    destinationRole: 'QC_Stock',
    sourceLabel: 'Quality Control',
    destinationLabel: 'Stock/Storage',
    targetStatus: 'ADDED_TO_STOCK',
    icon: Icons.inventory_2_outlined,
  ),
  _VoucherRoute(
    key: 'qc_delivery',
    title: 'QC to Delivery',
    subtitle: 'Quality Control to Delivery',
    voucherType: 'ISSUE',
    sourceRole: 'QC_Stock',
    destinationRole: 'Delivery',
    sourceLabel: 'Quality Control',
    destinationLabel: 'Delivery',
    targetStatus: 'HANDED_TO_DELIVERY',
    icon: Icons.delivery_dining_outlined,
  ),
];

_VoucherRoute _routeForBatch(Map<String, dynamic>? batch) {
  final targetStatus = batch?['target_status']?.toString();
  return _voucherRoutes.firstWhere(
    (route) => route.targetStatus == targetStatus,
    orElse: () => _voucherRoutes.first,
  );
}

bool _routeAllowedForRoles(_VoucherRoute route, List<Role> roles) {
  if (roles.contains(Role.admin)) {
    return true;
  }
  switch (route.targetStatus) {
    case 'DISPATCHED_TO_FACTORY':
      return roles.contains(Role.dispatch);
    case 'RECEIVED_AT_FACTORY':
      return roles.contains(Role.factory);
    case 'RECEIVED_AT_SHOP':
    case 'ADDED_TO_STOCK':
    case 'HANDED_TO_DELIVERY':
      return roles.contains(Role.qcStock);
    default:
      return false;
  }
}

class DispatchScreen extends ConsumerStatefulWidget {
  const DispatchScreen({super.key});

  @override
  ConsumerState<DispatchScreen> createState() => _DispatchScreenState();
}

class _DispatchScreenState extends ConsumerState<DispatchScreen> {
  static const _batchStorageKey = 'dispatch_selected_batch_id';
  static const _factoryStorageKey = 'dispatch_selected_factory_id';
  static const _routeStorageKey = 'dispatch_selected_route_key';

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  List<dynamic> _batches = [];
  String? _selectedBatchId;
  String _selectedRouteKey = _voucherRoutes.first.key;
  List<dynamic> _factories = [];
  String? _selectedFactoryId;
  bool _loading = false;
  bool _creating = false;
  bool _loadingFactories = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_initialize);
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _initialize() async {
    await _restoreSelections();
    final roles = ref.read(authControllerProvider).roles;
    final availableRoutes = _voucherRoutes
        .where((route) => _routeAllowedForRoles(route, roles))
        .toList();
    if (availableRoutes.isNotEmpty &&
        !availableRoutes.any((route) => route.key == _selectedRouteKey)) {
      _selectedRouteKey = availableRoutes.first.key;
      await _persistRouteSelection(_selectedRouteKey);
    }
    await Future.wait<void>([
      _loadFactories(),
      _loadBatches(),
    ]);
  }

  Future<void> _restoreSelections() async {
    final savedBatchId = await _storage.read(key: _batchStorageKey);
    final savedFactoryId = await _storage.read(key: _factoryStorageKey);
    final savedRouteKey = await _storage.read(key: _routeStorageKey);
    if (!mounted) return;
    setState(() {
      _selectedBatchId = savedBatchId;
      _selectedFactoryId = savedFactoryId;
      if (_voucherRoutes.any((route) => route.key == savedRouteKey)) {
        _selectedRouteKey = savedRouteKey!;
      }
    });
  }

  Future<void> _persistBatchSelection(String? batchId) async {
    if (batchId == null || batchId.isEmpty) {
      await _storage.delete(key: _batchStorageKey);
      return;
    }
    await _storage.write(key: _batchStorageKey, value: batchId);
  }

  Future<void> _persistFactorySelection(String? factoryId) async {
    if (factoryId == null || factoryId.isEmpty) {
      await _storage.delete(key: _factoryStorageKey);
      return;
    }
    await _storage.write(key: _factoryStorageKey, value: factoryId);
  }

  Future<void> _persistRouteSelection(String routeKey) async {
    await _storage.write(key: _routeStorageKey, value: routeKey);
  }

  _VoucherRoute get _selectedRoute => _voucherRoutes.firstWhere(
        (route) => route.key == _selectedRouteKey,
        orElse: () => _voucherRoutes.first,
      );

  List<Map<String, dynamic>> get _routeBatches {
    return _batches
        .whereType<Map<String, dynamic>>()
        .where((batch) => _routeForBatch(batch).key == _selectedRouteKey)
        .toList();
  }

  void _onRouteChanged(String? value) {
    if (value == null || value.isEmpty || value == _selectedRouteKey) {
      return;
    }
    final batchesForRoute = _batches
        .whereType<Map<String, dynamic>>()
        .where((batch) => _routeForBatch(batch).key == value)
        .toList();
    final nextBatchId =
        batchesForRoute.isEmpty ? null : batchesForRoute.first['id'] as String?;
    setState(() {
      _selectedRouteKey = value;
      _selectedBatchId = nextBatchId;
    });
    _persistRouteSelection(value);
    _persistBatchSelection(nextBatchId);
  }

  void _onBatchChanged(String? value) {
    final batch = _findBatchById(value);
    final batchFactoryId = _batchFactoryId(batch);
    setState(() {
      _selectedBatchId = value;
      if (batchFactoryId != null && batchFactoryId.isNotEmpty) {
        _selectedFactoryId = batchFactoryId;
      }
    });
    _persistBatchSelection(value);
    if (batchFactoryId != null && batchFactoryId.isNotEmpty) {
      _persistFactorySelection(batchFactoryId);
    }
  }

  void _onFactoryChanged(String? value) {
    setState(() => _selectedFactoryId = value);
    _persistFactorySelection(value);
  }

  Future<void> _loadBatches() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      final batches = await api.listBatches();
      if (!mounted) return;
      String? nextSelectedBatchId = _selectedBatchId;
      setState(() {
        _batches = batches;
        final batchesForRoute = _routeBatches;
        if (batchesForRoute.isEmpty) {
          nextSelectedBatchId = null;
        } else if (nextSelectedBatchId == null ||
            !batchesForRoute
                .any((batch) => batch['id'] == nextSelectedBatchId)) {
          nextSelectedBatchId = batchesForRoute.first['id'] as String?;
        }
        _selectedBatchId = nextSelectedBatchId;
        final selectedBatch = _findBatchById(nextSelectedBatchId);
        final batchFactoryId = _batchFactoryId(selectedBatch);
        if (batchFactoryId != null && batchFactoryId.isNotEmpty) {
          _selectedFactoryId = batchFactoryId;
        }
      });
      await _persistBatchSelection(nextSelectedBatchId);
      final selectedBatch = _findBatchById(nextSelectedBatchId);
      final batchFactoryId = _batchFactoryId(selectedBatch);
      if (batchFactoryId != null && batchFactoryId.isNotEmpty) {
        await _persistFactorySelection(batchFactoryId);
      }
    } catch (error) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Failed to load vouchers: $error'),
          backgroundColor: MajesticColors.danger,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _loadFactories() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _loadingFactories = true);
    try {
      final api = ref.read(apiClientProvider);
      final factories = await api.listFactories();
      if (!mounted) return;
      String? nextSelectedFactoryId = _selectedFactoryId;
      setState(() {
        _factories = factories;
        if (factories.isEmpty) {
          nextSelectedFactoryId = null;
        } else if (nextSelectedFactoryId == null ||
            !_factories
                .any((factory) => factory['id'] == nextSelectedFactoryId)) {
          nextSelectedFactoryId = factories.first['id'] as String?;
        }
        _selectedFactoryId = nextSelectedFactoryId;
      });
      await _persistFactorySelection(nextSelectedFactoryId);
    } catch (error) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Failed to load factories: $error'),
          backgroundColor: MajesticColors.danger,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _loadingFactories = false);
      }
    }
  }

  Future<void> _createBatch() async {
    final messenger = ScaffoldMessenger.of(context);
    final route = _selectedRoute;
    if (route.requiresFactory &&
        (_selectedFactoryId == null || _selectedFactoryId!.isEmpty)) {
      messenger.showSnackBar(
        const SnackBar(
            content: Text('Select a factory before creating this voucher')),
      );
      return;
    }

    setState(() => _creating = true);
    try {
      final api = ref.read(apiClientProvider);
      final batch = await api.createBatch(
        factoryId: route.requiresFactory ? _selectedFactoryId : null,
        voucherType: route.voucherType,
        sourceRole: route.sourceRole,
        destinationRole: route.destinationRole,
        targetStatus: route.targetStatus,
      );
      if (!mounted) return;
      await _loadBatches();
      final createdBatchId = batch['id'] as String?;
      setState(() => _selectedBatchId = createdBatchId);
      await _persistBatchSelection(createdBatchId);
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Voucher created successfully'),
          backgroundColor: MajesticColors.success,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Failed to create voucher: $error'),
          backgroundColor: MajesticColors.danger,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _creating = false);
      }
    }
  }

  Map<String, dynamic>? _findBatchById(String? batchId) {
    if (batchId == null || batchId.isEmpty) {
      return null;
    }
    for (final entry in _batches) {
      if (entry is Map<String, dynamic> && entry['id'] == batchId) {
        return entry;
      }
    }
    return null;
  }

  String? _batchFactoryId(Map<String, dynamic>? batch) {
    final value = batch?['factory_id']?.toString();
    if (value == null || value.isEmpty) {
      return null;
    }
    return value;
  }

  String? _factoryNameForId(String? factoryId) {
    if (factoryId == null || factoryId.isEmpty) {
      return null;
    }
    for (final entry in _factories) {
      if (entry is Map<String, dynamic> && entry['id'] == factoryId) {
        final name = entry['name']?.toString();
        if (name != null && name.isNotEmpty) {
          return name;
        }
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final roles = ref.watch(authControllerProvider).roles;
    final availableRoutes = _voucherRoutes
        .where((route) => _routeAllowedForRoles(route, roles))
        .toList();
    final selectedRoute = availableRoutes
            .any((route) => route.key == _selectedRouteKey)
        ? _selectedRoute
        : (availableRoutes.isNotEmpty ? availableRoutes.first : _selectedRoute);
    final routeBatches = _batches
        .whereType<Map<String, dynamic>>()
        .where((batch) => _routeForBatch(batch).key == selectedRoute.key)
        .toList();
    final selectedBatch = _findBatchById(_selectedBatchId);
    final lockedFactoryId = _batchFactoryId(selectedBatch);
    final lockedFactoryName = selectedBatch?['factory_name']?.toString();
    final selectedFactoryName = _factoryNameForId(_selectedFactoryId);
    final effectiveFactoryId = lockedFactoryId ?? _selectedFactoryId;
    final effectiveFactoryName =
        (lockedFactoryName != null && lockedFactoryName.isNotEmpty)
            ? lockedFactoryName
            : _factoryNameForId(effectiveFactoryId);
    final selectedBatchItemCount =
        (selectedBatch?['item_count'] as num?)?.toInt() ?? 0;
    final canScanSelectedBatch = selectedBatch != null &&
        _routeForBatch(selectedBatch).key == selectedRoute.key &&
        selectedBatch['status']?.toString() == 'CREATED' &&
        (!selectedRoute.requiresFactory ||
            (effectiveFactoryId != null && effectiveFactoryId.isNotEmpty));

    return MajesticScaffold(
      title: 'Voucher Center',
      padding: EdgeInsets.zero,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header
          Container(
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
                        MajesticColors.gold.withValues(alpha: 0.12),
                        MajesticColors.forest.withValues(alpha: 0.05),
                      ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark
                    ? MajesticColors.darkBorder
                    : MajesticColors.gold.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: isDark
                        ? MajesticColors.gold.withValues(alpha: 0.2)
                        : MajesticColors.gold.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.local_shipping_outlined,
                    color: MajesticColors.gold,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Bulk Voucher Center',
                          style: theme.textTheme.titleMedium),
                      const SizedBox(height: 4),
                      Text(
                        'Issue, receive, and route many items under one voucher.',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Refresh vouchers',
                  onPressed: () {
                    _loadFactories();
                    _loadBatches();
                  },
                  icon: Icon(
                    Icons.refresh_rounded,
                    color: isDark ? MajesticColors.gold : MajesticColors.forest,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          const SectionHeader(title: 'Route'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MajesticDropdown<String>(
                    label: 'Source to Destination',
                    value: selectedRoute.key,
                    items: availableRoutes
                        .map(
                          (route) => DropdownMenuItem<String>(
                            value: route.key,
                            child: Text(route.title),
                          ),
                        )
                        .toList(),
                    onChanged: _onRouteChanged,
                  ),
                  const SizedBox(height: 12),
                  _DispatchInfoBanner(
                    icon: selectedRoute.icon,
                    title: selectedRoute.subtitle,
                    lines: [
                      '${selectedRoute.sourceLabel} to ${selectedRoute.destinationLabel}',
                      'Scan result: ${_formatBatchStatus(selectedRoute.targetStatus)}',
                    ],
                    tone: _DispatchInfoTone.warning,
                    isDark: isDark,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Voucher selection
          const SectionHeader(title: 'Active Voucher'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Continue with the current voucher. Factory stays fixed once the voucher is assigned.',
                    style: theme.textTheme.bodySmall,
                  ),
                  const SizedBox(height: 16),
                  if (_loading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  else if (routeBatches.isEmpty)
                    EmptyState(
                      icon: Icons.inventory_2_outlined,
                      title: 'No ${selectedRoute.title.toLowerCase()} vouchers',
                      subtitle:
                          'Create a voucher for this route to start scanning',
                    )
                  else ...[
                    MajesticDropdown<String>(
                      label: 'Select Voucher',
                      value: _selectedBatchId,
                      items: routeBatches
                          .map(
                            (batch) => DropdownMenuItem<String>(
                              value: batch['id'] as String,
                              child: Text(
                                '${batch['batch_code']} • ${_formatBatchStatus(batch['status']?.toString())}',
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: _onBatchChanged,
                    ),
                    const SizedBox(height: 12),
                    if (selectedBatch != null) ...[
                      _DispatchInfoBanner(
                        icon: Icons.confirmation_number_outlined,
                        title: selectedBatch['batch_code']?.toString() ??
                            'Voucher',
                        lines: [
                          'Status: ${_formatBatchStatus(selectedBatch['status']?.toString())}',
                          'Items: $selectedBatchItemCount',
                          'Created: ${_formatBatchDateTime(context, selectedBatch['created_at'])}',
                          '${selectedRoute.sourceLabel} to ${selectedRoute.destinationLabel}',
                          if (effectiveFactoryName != null)
                            'Factory: $effectiveFactoryName',
                        ],
                        isDark: isDark,
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (!selectedRoute.requiresFactory)
                      _DispatchInfoBanner(
                        icon: Icons.route_outlined,
                        title: 'Route Locked',
                        lines: [
                          '${selectedRoute.sourceLabel} to ${selectedRoute.destinationLabel} will be used for every scan in this voucher.',
                        ],
                        tone: _DispatchInfoTone.success,
                        isDark: isDark,
                      )
                    else if (_loadingFactories)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(12),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else if (_factories.isEmpty)
                      const EmptyState(
                        icon: Icons.factory_outlined,
                        title: 'No factories',
                        subtitle: 'Add factories in settings to use this route',
                      )
                    else if (lockedFactoryId != null)
                      _DispatchInfoBanner(
                        icon: Icons.lock_outline,
                        title: 'Factory Locked',
                        lines: [
                          '${effectiveFactoryName ?? 'Assigned factory'} will be used for every scan in this voucher.',
                        ],
                        tone: _DispatchInfoTone.success,
                        isDark: isDark,
                      )
                    else
                      MajesticDropdown<String>(
                        label: 'Factory for this voucher',
                        value: _selectedFactoryId,
                        items: _factories
                            .map(
                              (factory) => DropdownMenuItem<String>(
                                value: factory['id'] as String,
                                child: Text(factory['name'].toString()),
                              ),
                            )
                            .toList(),
                        onChanged: _onFactoryChanged,
                      ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Create voucher
          const SectionHeader(title: 'Create Voucher'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Open a fresh ${selectedRoute.title.toLowerCase()} voucher. Voucher number and created time are assigned automatically.',
                    style: theme.textTheme.bodySmall,
                  ),
                  const SizedBox(height: 16),
                  if (selectedRoute.requiresFactory && _loadingFactories)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  else if (selectedRoute.requiresFactory && _factories.isEmpty)
                    const EmptyState(
                      icon: Icons.factory_outlined,
                      title: 'No factories available',
                      subtitle: 'Add a factory before creating vouchers',
                    )
                  else ...[
                    if (selectedRoute.requiresFactory) ...[
                      MajesticDropdown<String>(
                        label: 'Factory',
                        value: _selectedFactoryId,
                        items: _factories
                            .map(
                              (factory) => DropdownMenuItem<String>(
                                value: factory['id'] as String,
                                child: Text(factory['name'].toString()),
                              ),
                            )
                            .toList(),
                        onChanged: _onFactoryChanged,
                      ),
                      const SizedBox(height: 16),
                    ],
                    _DispatchInfoBanner(
                      icon: Icons.auto_awesome_outlined,
                      title: 'Quick Create',
                      lines: [
                        'The new ${selectedRoute.title.toLowerCase()} voucher becomes active immediately.',
                        '${selectedRoute.sourceLabel} to ${selectedRoute.destinationLabel}',
                        if (selectedRoute.requiresFactory &&
                            selectedFactoryName != null)
                          'Factory: $selectedFactoryName',
                      ],
                      tone: _DispatchInfoTone.warning,
                      isDark: isDark,
                    ),
                    const SizedBox(height: 16),
                    LoadingButton(
                      onPressed: _createBatch,
                      label: !selectedRoute.requiresFactory ||
                              selectedFactoryName == null
                          ? 'Create Voucher'
                          : 'Create $selectedFactoryName Voucher',
                      icon: Icons.add_box_outlined,
                      isLoading: _creating,
                      variant: LoadingButtonVariant.secondary,
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Scan action
          if (selectedBatch != null) ...[
            const SectionHeader(title: 'Scan Items'),
            _SelectedBatchCard(
              batch: selectedBatch,
              isDark: isDark,
              factoryName: effectiveFactoryName,
              createdAt:
                  _formatBatchDateTime(context, selectedBatch['created_at']),
              itemCount: selectedBatchItemCount,
              helperText: canScanSelectedBatch
                  ? 'Every scan will move the item to ${_formatBatchStatus(selectedRoute.targetStatus)} and add it to this voucher.'
                  : selectedRoute.requiresFactory && effectiveFactoryId == null
                      ? 'Select a factory first so scanned items can be linked to this voucher.'
                      : 'This voucher is already ${_formatBatchStatus(selectedBatch['status']?.toString()).toLowerCase()}. Select a CREATED voucher to continue scanning.',
              actionLabel: selectedBatchItemCount > 0
                  ? 'Continue Scanning'
                  : 'Scan ${selectedRoute.title}',
              onScan: canScanSelectedBatch
                  ? () {
                      Navigator.push(
                        context,
                        MajesticPageRoute(
                          page: ScanScreen(
                            targetStatus: selectedRoute.targetStatus,
                            batchId: _selectedBatchId,
                            batchCode: selectedBatch['batch_code'] as String?,
                            factoryId: selectedRoute.requiresFactory
                                ? effectiveFactoryId
                                : null,
                          ),
                        ),
                      );
                    }
                  : null,
            ),
          ],
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _SelectedBatchCard extends StatelessWidget {
  const _SelectedBatchCard({
    required this.batch,
    required this.isDark,
    required this.factoryName,
    required this.createdAt,
    required this.itemCount,
    required this.helperText,
    required this.actionLabel,
    required this.onScan,
  });

  final Map<String, dynamic> batch;
  final bool isDark;
  final String? factoryName;
  final String createdAt;
  final int itemCount;
  final String helperText;
  final String actionLabel;
  final VoidCallback? onScan;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: MajesticColors.forest.withValues(alpha: isDark ? 0.2 : 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: MajesticColors.forest.withValues(alpha: isDark ? 0.3 : 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark
                      ? MajesticColors.gold.withValues(alpha: 0.2)
                      : MajesticColors.gold.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  batch['batch_code'].toString(),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: MajesticColors.gold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark ? MajesticColors.darkSurface : Colors.white,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  _formatBatchStatus(batch['status']?.toString()),
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _BatchPill(
                icon: Icons.inventory_2_outlined,
                label: '$itemCount items',
                isDark: isDark,
              ),
              _BatchPill(
                icon: Icons.schedule_outlined,
                label: createdAt,
                isDark: isDark,
              ),
              if (factoryName != null)
                _BatchPill(
                  icon: Icons.factory_outlined,
                  label: factoryName!,
                  isDark: isDark,
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            helperText,
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onScan,
              icon: const Icon(Icons.qr_code_scanner),
              label: Text(actionLabel),
            ),
          ),
        ],
      ),
    );
  }
}

class _DispatchInfoBanner extends StatelessWidget {
  const _DispatchInfoBanner({
    required this.icon,
    required this.title,
    required this.lines,
    required this.isDark,
    this.tone = _DispatchInfoTone.neutral,
  });

  final IconData icon;
  final String title;
  final List<String> lines;
  final bool isDark;
  final _DispatchInfoTone tone;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final toneColor = switch (tone) {
      _DispatchInfoTone.success => MajesticColors.success,
      _DispatchInfoTone.warning => MajesticColors.gold,
      _DispatchInfoTone.neutral =>
        isDark ? MajesticColors.darkBorder : MajesticColors.forest,
    };

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: toneColor.withValues(alpha: isDark ? 0.16 : 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: toneColor.withValues(alpha: 0.18)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: toneColor.withValues(alpha: isDark ? 0.24 : 0.14),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: toneColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.titleSmall),
                const SizedBox(height: 4),
                for (final line in lines)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Text(line, style: theme.textTheme.bodySmall),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BatchPill extends StatelessWidget {
  const _BatchPill({
    required this.icon,
    required this.label,
    required this.isDark,
  });

  final IconData icon;
  final String label;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? MajesticColors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isDark
              ? MajesticColors.darkBorder
              : MajesticColors.ink.withValues(alpha: 0.08),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: isDark ? MajesticColors.goldLight : MajesticColors.forest,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

enum _DispatchInfoTone { neutral, success, warning }
