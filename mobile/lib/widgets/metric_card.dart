import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';

/// Modern metric card with animated value display
class MetricCard extends StatelessWidget {
  const MetricCard({
    super.key,
    required this.label,
    required this.value,
    this.subtitle,
    this.icon,
    this.color,
    this.trend,
    this.onTap,
    this.isLoading = false,
  });

  final String label;
  final String? value;
  final String? subtitle;
  final IconData? icon;
  final Color? color;
  final MetricTrend? trend;
  final VoidCallback? onTap;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final effectiveColor = color ?? theme.colorScheme.primary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: effectiveColor.withValues(alpha: isDark ? 0.15 : 0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: effectiveColor.withValues(alpha: isDark ? 0.25 : 0.12),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  if (icon != null) ...[
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: effectiveColor.withValues(alpha: isDark ? 0.25 : 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        icon,
                        size: 18,
                        color: effectiveColor,
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Text(
                      label,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.7),
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (trend != null) _buildTrendIndicator(isDark),
                ],
              ),
              const SizedBox(height: 12),
              if (isLoading)
                SizedBox(
                  height: 28,
                  child: Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: effectiveColor,
                      ),
                    ),
                  ),
                )
              else
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: Text(
                    value ?? '--',
                    key: ValueKey(value),
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: isDark ? MajesticColors.darkText : MajesticColors.ink,
                      fontSize: 24,
                    ),
                  ),
                ),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5),
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrendIndicator(bool isDark) {
    final isUp = trend == MetricTrend.up;
    final isDown = trend == MetricTrend.down;
    final trendColor = isUp
        ? MajesticColors.success
        : isDown
            ? MajesticColors.danger
            : (isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.4));

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: trendColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isUp
                ? Icons.trending_up
                : isDown
                    ? Icons.trending_down
                    : Icons.trending_flat,
            size: 12,
            color: trendColor,
          ),
        ],
      ),
    );
  }
}

enum MetricTrend { up, down, flat }

/// Grid of metric cards with responsive layout
class MetricGrid extends StatelessWidget {
  const MetricGrid({
    super.key,
    required this.metrics,
    this.crossAxisCount = 2,
    this.spacing = 12,
    this.isLoading = false,
  });

  final List<MetricCardData> metrics;
  final int crossAxisCount;
  final double spacing;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = (constraints.maxWidth - (spacing * (crossAxisCount - 1))) / crossAxisCount;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: metrics.map((metric) {
            return SizedBox(
              width: itemWidth,
              child: MetricCard(
                label: metric.label,
                value: metric.value,
                subtitle: metric.subtitle,
                icon: metric.icon,
                color: metric.color,
                trend: metric.trend,
                onTap: metric.onTap,
                isLoading: isLoading,
              ),
            );
          }).toList(),
        );
      },
    );
  }
}

class MetricCardData {
  const MetricCardData({
    required this.label,
    this.value,
    this.subtitle,
    this.icon,
    this.color,
    this.trend,
    this.onTap,
  });

  final String label;
  final String? value;
  final String? subtitle;
  final IconData? icon;
  final Color? color;
  final MetricTrend? trend;
  final VoidCallback? onTap;
}

/// Compact sync status indicator
class SyncStatusCard extends StatelessWidget {
  const SyncStatusCard({
    super.key,
    required this.offlineJobs,
    required this.pendingScans,
    required this.onSync,
    this.isSyncing = false,
    this.lastSyncTime,
  });

  final int? offlineJobs;
  final int? pendingScans;
  final VoidCallback onSync;
  final bool isSyncing;
  final DateTime? lastSyncTime;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final hasQueuedItems = (offlineJobs ?? 0) > 0 || (pendingScans ?? 0) > 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? MajesticColors.darkCard : MajesticColors.cloud,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasQueuedItems
              ? MajesticColors.warning.withValues(alpha: 0.3)
              : (isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.08)),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: (hasQueuedItems ? MajesticColors.warning : MajesticColors.success)
                      .withValues(alpha: isDark ? 0.2 : 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  hasQueuedItems ? Icons.cloud_queue : Icons.cloud_done,
                  size: 20,
                  color: hasQueuedItems ? MajesticColors.warning : MajesticColors.success,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Sync Status',
                      style: theme.textTheme.titleSmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      lastSyncTime != null
                          ? 'Last sync: ${_formatTime(lastSyncTime!)}'
                          : 'Not synced yet',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              _SyncButton(
                onPressed: onSync,
                isSyncing: isSyncing,
              ),
            ],
          ),
          if (hasQueuedItems) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _QueueMetric(
                    label: 'Offline Jobs',
                    count: offlineJobs,
                    isDark: isDark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QueueMetric(
                    label: 'Queued Scans',
                    count: pendingScans,
                    isDark: isDark,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _SyncButton extends StatelessWidget {
  const _SyncButton({
    required this.onPressed,
    required this.isSyncing,
  });

  final VoidCallback onPressed;
  final bool isSyncing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: theme.colorScheme.primary.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: isSyncing ? null : onPressed,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isSyncing)
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: theme.colorScheme.primary,
                  ),
                )
              else
                Icon(
                  Icons.sync,
                  size: 18,
                  color: theme.colorScheme.primary,
                ),
              const SizedBox(width: 6),
              Text(
                isSyncing ? 'Syncing' : 'Sync',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QueueMetric extends StatelessWidget {
  const _QueueMetric({
    required this.label,
    required this.count,
    required this.isDark,
  });

  final String label;
  final int? count;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? MajesticColors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            count?.toString() ?? '--',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
