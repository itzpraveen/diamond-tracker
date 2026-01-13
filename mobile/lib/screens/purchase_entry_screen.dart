import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';

class PurchaseEntryScreen extends ConsumerStatefulWidget {
  const PurchaseEntryScreen({super.key});

  @override
  ConsumerState<PurchaseEntryScreen> createState() => _PurchaseEntryScreenState();
}

class _PurchaseEntryScreenState extends ConsumerState<PurchaseEntryScreen> {
  final _descriptionController = TextEditingController();
  final _customerController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _offline = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    _customerController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MajesticScaffold(
      title: 'Purchase Entry',
      child: ListView(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('New Item Intake', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(labelText: 'Item Description'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _customerController,
                    decoration: const InputDecoration(labelText: 'Customer Name'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    decoration: const InputDecoration(labelText: 'Customer Phone'),
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    value: _offline,
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Offline Mode'),
                    onChanged: (value) => setState(() => _offline = value),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final repo = ref.read(jobRepositoryProvider);
                        await repo.createJob({
                          'item_description': _descriptionController.text.trim(),
                          'customer_name': _customerController.text.trim(),
                          'customer_phone': _phoneController.text.trim(),
                        }, offline: _offline);
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job created')));
                        Navigator.pop(context);
                      },
                      child: const Text('Create Job'),
                    ),
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
