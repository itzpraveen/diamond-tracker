import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/widgets/action_card.dart';
import 'package:diamond_tracker_mobile/widgets/form_fields.dart';
import 'package:diamond_tracker_mobile/widgets/loading_button.dart';
import 'package:diamond_tracker_mobile/widgets/status_chip.dart';
import 'package:diamond_tracker_mobile/widgets/timeline.dart';

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
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final query = _queryController.text.trim();
    if (query.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a Job ID')),
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
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return MajesticScaffold(
      title: 'Lookup',
      padding: EdgeInsets.zero,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Search card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withValues(alpha: isDark ? 0.2 : 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.search,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Find Job',
                              style: theme.textTheme.titleMedium,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Search by job ID or scan code',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SearchField(
                    controller: _queryController,
                    hint: 'Enter Job ID...',
                    onSubmitted: (_) => _search(),
                    onClear: () => setState(() {
                      _job = null;
                      _errorMessage = null;
                    }),
                  ),
                  const SizedBox(height: 16),
                  LoadingButton(
                    onPressed: _search,
                    label: 'Search',
                    icon: Icons.search,
                    isLoading: _loading,
                  ),
                ],
              ),
            ),
          ),

          // Error
          if (_errorMessage != null) ...[
            const SizedBox(height: 16),
            Container(
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
                      _errorMessage!,
                      style: const TextStyle(color: MajesticColors.danger),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Results
          if (_job != null) ...[
            const SizedBox(height: 20),
            _JobDetailsCard(job: _job!, isDark: isDark),
            const SizedBox(height: 16),
            _TimelineCard(job: _job!, isDark: isDark),
          ],

          // Empty state
          if (_job == null && _errorMessage == null && !_loading) ...[
            const SizedBox(height: 40),
            EmptyState(
              icon: Icons.search_off,
              title: 'Search for a job',
              subtitle: 'Enter a job ID above to view details and timeline',
            ),
          ],
        ],
      ),
    );
  }
}

class _JobDetailsCard extends StatelessWidget {
  const _JobDetailsCard({required this.job, required this.isDark});

  final Map<String, dynamic> job;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentStatus = job['current_status']?.toString();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Job ${job['job_id']}',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (job['item_description'] != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          job['item_description'].toString(),
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ],
                  ),
                ),
                StatusChip(
                  status: currentStatus,
                  size: StatusChipSize.large,
                  showIcon: true,
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Metrics row
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? MajesticColors.darkSurface : MajesticColors.cloud,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _DetailItem(
                      icon: Icons.timer_outlined,
                      label: 'Pending',
                      value: '${_pendingDays(job)}d',
                      isDark: isDark,
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 40,
                    color: isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.1),
                  ),
                  Expanded(
                    child: _DetailItem(
                      icon: Icons.person_outline,
                      label: 'Holder',
                      value: job['current_holder_username']?.toString() ??
                          job['current_holder_role']?.toString() ??
                          '-',
                      isDark: isDark,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Additional info
            _InfoRow(
              icon: Icons.local_shipping_outlined,
              label: 'Sent to factory',
              value: _dispatchTimestamp(job),
              isDark: isDark,
            ),
            const SizedBox(height: 8),
            _InfoRow(
              icon: Icons.access_time,
              label: 'Last scan',
              value: _relativeTime(job['last_scan_at']?.toString()),
              isDark: isDark,
            ),
            if (job['customer_name'] != null) ...[
              const SizedBox(height: 8),
              _InfoRow(
                icon: Icons.person,
                label: 'Customer',
                value: job['customer_name'].toString(),
                isDark: isDark,
              ),
            ],
          ],
        ),
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
    return '${parsed.day}/${parsed.month}/${parsed.year}';
  }
}

class _DetailItem extends StatelessWidget {
  const _DetailItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.isDark,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Icon(
          icon,
          size: 20,
          color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.isDark,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: theme.textTheme.bodySmall,
        ),
        const Spacer(),
        Text(
          value,
          style: theme.textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _TimelineCard extends StatelessWidget {
  const _TimelineCard({required this.job, required this.isDark});

  final Map<String, dynamic> job;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final events = (job['status_events'] as List<dynamic>? ?? [])
        .map((e) => TimelineEvent.fromJson(e as Map<String, dynamic>))
        .toList()
        .reversed
        .toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.timeline,
                  size: 20,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 12),
                Text(
                  'Status Timeline',
                  style: theme.textTheme.titleMedium,
                ),
                const Spacer(),
                Text(
                  '${events.length} events',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 20),
            StatusTimeline(events: events),
          ],
        ),
      ),
    );
  }
}
