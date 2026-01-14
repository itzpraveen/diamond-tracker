import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';

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
    return MajesticScaffold(
      title: 'Lookup Job',
      padding: EdgeInsets.zero,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Job Lookup', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _queryController,
                    decoration: const InputDecoration(labelText: 'Job ID'),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final api = ref.read(apiClientProvider);
                        final job = await api.getJob(_queryController.text.trim());
                        setState(() => _job = job);
                      },
                      child: const Text('Search'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_job != null) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Status', style: Theme.of(context).textTheme.labelLarge?.copyWith(letterSpacing: 1.8)),
                    const SizedBox(height: 6),
                    Text(
                      _job!['current_status'] ?? '-',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _job!['current_holder_username'] != null
                          ? 'Holder: ${_job!['current_holder_username']} (${_job!['current_holder_role']})'
                          : 'Holder: ${_job!['current_holder_role'] ?? '-'}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Pending: ${_pendingDays(_job!)} day(s)',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Sent to factory: ${_dispatchTimestamp(_job!)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _job!['item_description'] ?? '',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 12),
                    Text('Timeline', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ...(_job!['status_events'] as List<dynamic>).map((event) {
                      final who = event['scanned_by_username'] ?? event['scanned_by_role'] ?? '-';
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.timeline, color: MajesticColors.forest),
                        title: Text('${event['from_status']} -> ${event['to_status']}'),
                        subtitle: Text('$who • ${event['timestamp']}'),
                      );
                    })
                  ],
                ),
              ),
            ),
          ]
        ],
      ),
    );
  }

  int _pendingDays(Map<String, dynamic> job) {
    final pendingSince = job['last_scan_at'] ?? job['created_at'];
    if (pendingSince == null) return 0;
    final parsed = DateTime.tryParse(pendingSince.toString());
    if (parsed == null) return 0;
    return DateTime.now().difference(parsed).inDays;
  }

  String _dispatchTimestamp(Map<String, dynamic> job) {
    final events = job['status_events'] as List<dynamic>? ?? [];
    for (final event in events) {
      if (event['to_status'] == 'DISPATCHED_TO_FACTORY') {
        return event['timestamp']?.toString() ?? '-';
      }
    }
    return '-';
  }
}
