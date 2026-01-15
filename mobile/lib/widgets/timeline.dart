import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/ui/status_utils.dart';

/// Modern timeline widget for displaying status history
class StatusTimeline extends StatelessWidget {
  const StatusTimeline({
    super.key,
    required this.events,
    this.isCompact = false,
  });

  final List<TimelineEvent> events;
  final bool isCompact;

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return const _EmptyTimeline();
    }

    return Column(
      children: List.generate(events.length, (index) {
        final event = events[index];
        final isFirst = index == 0;
        final isLast = index == events.length - 1;

        return _TimelineItem(
          event: event,
          isFirst: isFirst,
          isLast: isLast,
          isCompact: isCompact,
        );
      }),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  const _TimelineItem({
    required this.event,
    required this.isFirst,
    required this.isLast,
    required this.isCompact,
  });

  final TimelineEvent event;
  final bool isFirst;
  final bool isLast;
  final bool isCompact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final color = statusColor(event.toStatus);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline track
          SizedBox(
            width: 32,
            child: Column(
              children: [
                // Top line
                if (!isFirst)
                  Container(
                    width: 2,
                    height: 12,
                    color: color.withValues(alpha: 0.3),
                  ),
                // Dot
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: isFirst ? color : color.withValues(alpha: 0.3),
                    shape: BoxShape.circle,
                    border: isFirst
                        ? null
                        : Border.all(
                            color: color.withValues(alpha: 0.5),
                            width: 2,
                          ),
                    boxShadow: isFirst
                        ? [
                            BoxShadow(
                              color: color.withValues(alpha: 0.3),
                              blurRadius: 8,
                              spreadRadius: 1,
                            ),
                          ]
                        : null,
                  ),
                ),
                // Bottom line
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: isDark
                          ? MajesticColors.darkBorder
                          : MajesticColors.ink.withValues(alpha: 0.1),
                    ),
                  ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: Container(
              margin: EdgeInsets.only(bottom: isLast ? 0 : 16),
              padding: EdgeInsets.all(isCompact ? 12 : 16),
              decoration: BoxDecoration(
                color: isDark ? MajesticColors.darkCard : MajesticColors.cloud,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isFirst
                      ? color.withValues(alpha: 0.3)
                      : (isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.06)),
                  width: isFirst ? 2 : 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: isDark ? 0.2 : 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          statusLabel(event.toStatus),
                          style: TextStyle(
                            color: color,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        event.relativeTime,
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                  if (!isCompact) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(
                          Icons.person_outline,
                          size: 14,
                          color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            event.scannedBy,
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (event.fromStatus != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Text(
                            statusLabel(event.fromStatus),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: statusColor(event.fromStatus).withValues(alpha: 0.7),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Icon(
                              Icons.arrow_forward,
                              size: 12,
                              color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.4),
                            ),
                          ),
                          Text(
                            statusLabel(event.toStatus),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: color,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (event.remarks != null && event.remarks!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        event.remarks!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyTimeline extends StatelessWidget {
  const _EmptyTimeline();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? MajesticColors.darkCard : MajesticColors.cloud,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.08),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.timeline_outlined,
            size: 48,
            color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 12),
          Text(
            'No events yet',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}

class TimelineEvent {
  const TimelineEvent({
    required this.toStatus,
    required this.timestamp,
    required this.scannedBy,
    this.fromStatus,
    this.remarks,
  });

  final String? fromStatus;
  final String toStatus;
  final DateTime timestamp;
  final String scannedBy;
  final String? remarks;

  String get relativeTime {
    final diff = DateTime.now().difference(timestamp);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
  }

  factory TimelineEvent.fromJson(Map<String, dynamic> json) {
    final timestamp = json['timestamp'] != null
        ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
        : DateTime.now();

    return TimelineEvent(
      fromStatus: json['from_status']?.toString(),
      toStatus: json['to_status']?.toString() ?? 'UNKNOWN',
      timestamp: timestamp,
      scannedBy: json['scanned_by_username']?.toString() ??
          json['scanned_by_role']?.toString() ??
          'Unknown',
      remarks: json['remarks']?.toString(),
    );
  }
}

/// Simple progress stepper for multi-step forms
class ProgressStepper extends StatelessWidget {
  const ProgressStepper({
    super.key,
    required this.steps,
    required this.currentStep,
    this.onStepTap,
  });

  final List<String> steps;
  final int currentStep;
  final void Function(int)? onStepTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Row(
      children: List.generate(steps.length * 2 - 1, (index) {
        if (index.isOdd) {
          // Connector
          final isCompleted = index ~/ 2 < currentStep;
          return Expanded(
            child: Container(
              height: 2,
              color: isCompleted
                  ? theme.colorScheme.primary
                  : (isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.1)),
            ),
          );
        }

        final stepIndex = index ~/ 2;
        final isCompleted = stepIndex < currentStep;
        final isCurrent = stepIndex == currentStep;

        return GestureDetector(
          onTap: onStepTap != null && stepIndex <= currentStep
              ? () => onStepTap!(stepIndex)
              : null,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isCompleted || isCurrent
                      ? theme.colorScheme.primary
                      : (isDark ? MajesticColors.darkCard : MajesticColors.cloud),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isCompleted || isCurrent
                        ? theme.colorScheme.primary
                        : (isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.2)),
                    width: 2,
                  ),
                ),
                child: Center(
                  child: isCompleted
                      ? Icon(
                          Icons.check,
                          size: 16,
                          color: theme.colorScheme.onPrimary,
                        )
                      : Text(
                          '${stepIndex + 1}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isCurrent
                                ? theme.colorScheme.onPrimary
                                : (isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5)),
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                steps[stepIndex],
                style: theme.textTheme.labelSmall?.copyWith(
                  color: isCompleted || isCurrent
                      ? (isDark ? MajesticColors.darkText : MajesticColors.ink)
                      : (isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5)),
                  fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
