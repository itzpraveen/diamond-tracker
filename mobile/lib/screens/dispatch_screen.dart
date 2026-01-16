import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/screens/scan_screen.dart';
import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/widgets/action_card.dart';
import 'package:diamond_tracker_mobile/widgets/form_fields.dart';
import 'package:diamond_tracker_mobile/widgets/loading_button.dart';

class DispatchScreen extends ConsumerStatefulWidget {
  const DispatchScreen({super.key});

  @override
  ConsumerState<DispatchScreen> createState() => _DispatchScreenState();
}

class _DispatchScreenState extends ConsumerState<DispatchScreen> {
  final _monthController = TextEditingController();
  final _yearController = TextEditingController();
  List<dynamic> _batches = [];
  String? _selectedBatchId;
  List<dynamic> _factories = [];
  String? _selectedFactoryId;
  bool _loading = false;
  bool _creating = false;
  bool _loadingFactories = false;

  @override
  void initState() {
    super.initState();
    _loadBatches();
    _loadFactories();

    // Pre-fill with current month/year
    final now = DateTime.now();
    _monthController.text = now.month.toString();
    _yearController.text = now.year.toString();
  }

  @override
  void dispose() {
    _monthController.dispose();
    _yearController.dispose();
    super.dispose();
  }

  Future<void> _loadBatches() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      final batches = await api.listBatches();
      if (!mounted) return;
      setState(() {
        _batches = batches;
        if (batches.isEmpty) {
          _selectedBatchId = null;
        } else if (_selectedBatchId == null ||
            !_batches.any((batch) => batch['id'] == _selectedBatchId)) {
          _selectedBatchId = batches.first['id'] as String?;
        }
      });
    } catch (error) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Failed to load batches: $error'),
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
      setState(() {
        _factories = factories;
        if (factories.isEmpty) {
          _selectedFactoryId = null;
        } else if (_selectedFactoryId == null ||
            !_factories.any((factory) => factory['id'] == _selectedFactoryId)) {
          _selectedFactoryId = factories.first['id'] as String?;
        }
      });
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
    final month = int.tryParse(_monthController.text.trim());
    final year = int.tryParse(_yearController.text.trim());

    if (month == null || month < 1 || month > 12) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Enter a valid month (1-12)')),
      );
      return;
    }

    if (year == null || year < 2020 || year > 2100) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Enter a valid year')),
      );
      return;
    }

    setState(() => _creating = true);
    try {
      final api = ref.read(apiClientProvider);
      final batch = await api.createBatch(year: year, month: month);
      if (!mounted) return;
      await _loadBatches();
      setState(() => _selectedBatchId = batch['id'] as String?);
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Batch created successfully'),
          backgroundColor: MajesticColors.success,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Failed to create batch: $error'),
          backgroundColor: MajesticColors.danger,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _creating = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final selectedBatch = _batches.firstWhere(
      (batch) => batch['id'] == _selectedBatchId,
      orElse: () => null,
    );
    String? selectedFactoryName;
    for (final factory in _factories) {
      if (factory['id'] == _selectedFactoryId) {
        selectedFactoryName = factory['name']?.toString();
        break;
      }
    }

    return MajesticScaffold(
      title: 'Dispatch',
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
                      Text(
                        'Dispatch Center',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Manage batches and dispatch items to factory',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Batch selection
          const SectionHeader(title: 'Active Batch'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_loading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  else if (_batches.isEmpty)
                    EmptyState(
                      icon: Icons.inventory_2_outlined,
                      title: 'No batches',
                      subtitle: 'Create a new batch to start dispatching',
                    )
                  else ...[
                    MajesticDropdown<String>(
                      label: 'Select Batch',
                      value: _selectedBatchId,
                      items: _batches
                          .map(
                            (batch) => DropdownMenuItem(
                              value: batch['id'] as String,
                              child: Text('${batch['batch_code']} (${batch['status']})'),
                            ),
                          )
                          .toList(),
                      onChanged: (value) => setState(() => _selectedBatchId = value),
                    ),
                    const SizedBox(height: 12),
                    if (_loadingFactories)
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
                        subtitle: 'Add factories in settings to dispatch items',
                      )
                    else
                      MajesticDropdown<String>(
                        label: 'Select Factory',
                        value: _selectedFactoryId,
                        items: _factories
                            .map(
                              (factory) => DropdownMenuItem(
                                value: factory['id'] as String,
                                child: Text(factory['name'].toString()),
                              ),
                            )
                            .toList(),
                        onChanged: (value) => setState(() => _selectedFactoryId = value),
                      ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          _loadBatches();
                          _loadFactories();
                        },
                        icon: const Icon(Icons.refresh, size: 18),
                        label: const Text('Refresh'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Create batch
          const SectionHeader(title: 'Create Batch'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: MajesticTextField(
                          controller: _monthController,
                          label: 'Month',
                          hint: '1-12',
                          keyboardType: TextInputType.number,
                          prefixIcon: Icons.calendar_month,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: MajesticTextField(
                          controller: _yearController,
                          label: 'Year',
                          keyboardType: TextInputType.number,
                          prefixIcon: Icons.calendar_today,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  LoadingButton(
                    onPressed: _createBatch,
                    label: 'Create Batch',
                    icon: Icons.add,
                    isLoading: _creating,
                    variant: LoadingButtonVariant.secondary,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Scan action
          if (selectedBatch != null) ...[
            const SectionHeader(title: 'Dispatch Items'),
            _SelectedBatchCard(
              batch: selectedBatch,
              isDark: isDark,
              factoryName: selectedFactoryName,
              onScan: () {
                if (_selectedFactoryId == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Select a factory before dispatching'),
                      backgroundColor: MajesticColors.danger,
                    ),
                  );
                  return;
                }
                Navigator.push(
                  context,
                  MajesticPageRoute(
                    page: ScanScreen(
                      targetStatus: 'DISPATCHED_TO_FACTORY',
                      batchId: _selectedBatchId,
                      batchCode: selectedBatch['batch_code'] as String?,
                      factoryId: _selectedFactoryId,
                    ),
                  ),
                );
              },
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
    required this.onScan,
  });

  final Map<String, dynamic> batch;
  final bool isDark;
  final String? factoryName;
  final VoidCallback onScan;

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
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark ? MajesticColors.gold.withValues(alpha: 0.2) : MajesticColors.gold.withValues(alpha: 0.15),
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
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark ? MajesticColors.darkSurface : Colors.white,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  batch['status'].toString(),
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Scan items to add to this batch and dispatch to factory',
            style: theme.textTheme.bodyMedium,
          ),
          if (factoryName != null) ...[
            const SizedBox(height: 8),
            Text(
              'Factory: $factoryName',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.6),
              ),
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onScan,
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Scan to Dispatch'),
            ),
          ),
        ],
      ),
    );
  }
}
