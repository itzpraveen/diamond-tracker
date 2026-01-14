import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/ui/status_utils.dart';

class LookupScreen extends ConsumerStatefulWidget {
  const LookupScreen({super.key});

  @override
  ConsumerState<LookupScreen> createState() => _LookupScreenState();
}

class _LookupScreenState extends ConsumerState<LookupScreen> {
  final _queryController = TextEditingController();
  Map<String, dynamic>? _job;
  String? _errorMessage;
  bool _loading = false;

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
                        final query = _queryController.text.trim();
                        if (query.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Enter a Job ID.')),
                          );
                          return;
                        }
                        setState(() {
                          _loading = true;
                          _errorMessage = null;
                          _job = null;
                        });
                        try {
                          final api = ref.read(apiClientProvider);
                          final job = await api.getJob(query);
                          if (!mounted) return;
                          setState(() => _job = job);
                        } catch (error) {
                          if (!mounted) return;
                          setState(() => _errorMessage = 'Unable to load job: $error');
                        } finally {
                          if (mounted) {
                            setState(() => _loading = false);
                          }
                        }
                      },
                      child: const Text('Search'),
                    ),
                  ),
                  if (_loading) ...[
                    const SizedBox(height: 12),
                    const LinearProgressIndicator(),
                  ],
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _errorMessage!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: MajesticColors.danger),
                    ),
                  ],
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
                    Row(
                      children: [
                        _statusChip(_job!['current_status']?.toString()),
                        const Spacer(),
                        Text(
                          'Pending ${_pendingDays(_job!)}d',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
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
                      'Sent to factory: ${_dispatchTimestamp(_job!)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Last scan: ${_relativeTime(_job!['last_scan_at']?.toString())}',
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
                      final fromStatus = statusLabel(event['from_status']?.toString());
                      final toStatus = statusLabel(event['to_status']?.toString());
                      final color = statusColor(event['to_status']?.toString());
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Icon(Icons.timeline, color: color),
                        title: Text('$fromStatus -> $toStatus'),
                        subtitle: Text('$who • ${_relativeTime(event['timestamp']?.toString())}'),
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
        return _relativeTime(event['timestamp']?.toString());
      }
    }
    return '-';
  }

  String _relativeTime(String? timestamp) {
    if (timestamp == null || timestamp.isEmpty) return '-';
    final parsed = DateTime.tryParse(timestamp);
    if (parsed == null) return timestamp;
    final diff = DateTime.now().difference(parsed);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 30) return '${diff.inDays}d ago';
    return '${parsed.year}-${parsed.month.toString().padLeft(2, '0')}-${parsed.day.toString().padLeft(2, '0')}';
  }

  Widget _statusChip(String? status) {
    final color = statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        statusLabel(status),
        style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12),
      ),
    );
  }
}
