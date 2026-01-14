import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/screens/scan_screen.dart';
import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';

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
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadBatches();
  }

  @override
  void dispose() {
    _monthController.dispose();
    _yearController.dispose();
    super.dispose();
  }

  Future<void> _loadBatches() async {
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load batches: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _createBatch() async {
    try {
      final api = ref.read(apiClientProvider);
      final month = int.tryParse(_monthController.text.trim());
      final year = int.tryParse(_yearController.text.trim());
      final batch = await api.createBatch(year: year, month: month);
      if (!mounted) return;
      await _loadBatches();
      setState(() => _selectedBatchId = batch['id'] as String?);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create batch: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedBatch = _batches.firstWhere(
      (batch) => batch['id'] == _selectedBatchId,
      orElse: () => null,
    );

    return MajesticScaffold(
      title: 'Dispatch',
      child: ListView(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Dispatch Overview', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  const Text('Create or select the monthly batch, then scan items to dispatch.'),
                  const SizedBox(height: 16),
                  if (_loading) const LinearProgressIndicator(),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
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
                    decoration: const InputDecoration(labelText: 'Active Batch'),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.refresh),
                      label: const Text('Refresh Batches'),
                      onPressed: _loadBatches,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('Create/Open Batch', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _monthController,
                          decoration: const InputDecoration(labelText: 'Month (1-12)'),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _yearController,
                          decoration: const InputDecoration(labelText: 'Year'),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _createBatch,
                      child: const Text('Create or Open Batch'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (selectedBatch != null) ...[
                    Text(
                      'Selected: ${selectedBatch['batch_code']}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.qr_code_scanner),
                        label: const Text('Scan to DISPATCHED_TO_FACTORY'),
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ScanScreen(
                              targetStatus: 'DISPATCHED_TO_FACTORY',
                              batchId: _selectedBatchId,
                              batchCode: selectedBatch['batch_code'] as String?,
                            ),
                          ),
                        ),
                      ),
                    )
                  ] else
                    const Text('Select a batch to start scanning.'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
