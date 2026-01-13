import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/state/providers.dart';

class IncidentScreen extends ConsumerStatefulWidget {
  const IncidentScreen({super.key});

  @override
  ConsumerState<IncidentScreen> createState() => _IncidentScreenState();
}

class _IncidentScreenState extends ConsumerState<IncidentScreen> {
  final _jobIdController = TextEditingController();
  final _descController = TextEditingController();
  String _type = 'StickerMismatch';

  @override
  void dispose() {
    _jobIdController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report Incident')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _jobIdController,
            decoration: const InputDecoration(labelText: 'Job ID (optional)'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _type,
            items: const [
              DropdownMenuItem(value: 'StickerMismatch', child: Text('StickerMismatch')),
              DropdownMenuItem(value: 'MissingItem', child: Text('MissingItem')),
              DropdownMenuItem(value: 'DuplicateScan', child: Text('DuplicateScan')),
              DropdownMenuItem(value: 'Damage', child: Text('Damage')),
              DropdownMenuItem(value: 'Other', child: Text('Other')),
            ],
            onChanged: (value) => setState(() => _type = value ?? 'Other'),
            decoration: const InputDecoration(labelText: 'Type'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descController,
            decoration: const InputDecoration(labelText: 'Description'),
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () async {
              final api = ref.read(apiClientProvider);
              await api.createIncident({
                'job_id': _jobIdController.text.trim().isEmpty ? null : _jobIdController.text.trim(),
                'type': _type,
                'description': _descController.text.trim(),
              });
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Incident submitted')));
              Navigator.pop(context);
            },
            child: const Text('Submit'),
          )
        ],
      ),
    );
  }
}
