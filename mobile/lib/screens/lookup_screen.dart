import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/state/providers.dart';

class LookupScreen extends ConsumerStatefulWidget {
  const LookupScreen({super.key});

  @override
  ConsumerState<LookupScreen> createState() => _LookupScreenState();
}

class _LookupScreenState extends ConsumerState<LookupScreen> {
  final _queryController = TextEditingController();
  Map<String, dynamic>? _job;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lookup Job')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _queryController,
              decoration: const InputDecoration(labelText: 'Job ID'),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () async {
                final api = ref.read(apiClientProvider);
                final job = await api.getJob(_queryController.text.trim());
                setState(() => _job = job);
              },
              child: const Text('Search'),
            ),
            const SizedBox(height: 16),
            if (_job != null)
              Expanded(
                child: ListView(
                  children: [
                    Text('Status: ${_job!['current_status']}'),
                    const SizedBox(height: 8),
                    Text(_job!['item_description'] ?? ''),
                    const SizedBox(height: 12),
                    const Text('Timeline', style: TextStyle(fontWeight: FontWeight.bold)),
                    ...(_job!['status_events'] as List<dynamic>).map((event) {
                      return ListTile(
                        title: Text('${event['from_status']} -> ${event['to_status']}'),
                        subtitle: Text(event['timestamp']),
                      );
                    })
                  ],
                ),
              )
          ],
        ),
      ),
    );
  }
}
