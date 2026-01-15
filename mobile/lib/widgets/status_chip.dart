import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/ui/status_utils.dart';

/// Modern status chip with semantic colors and optional animations
class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.status,
    this.label,
    this.size = StatusChipSize.medium,
    this.showIcon = false,
    this.animate = false,
  });

  final String? status;
  final String? label;
  final StatusChipSize size;
  final bool showIcon;
  final bool animate;

  @override
  Widget build(BuildContext context) {
    final color = statusColor(status);
    final displayLabel = label ?? statusLabel(status);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final padding = switch (size) {
      StatusChipSize.small => const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      StatusChipSize.medium => const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      StatusChipSize.large => const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    };

    final fontSize = switch (size) {
      StatusChipSize.small => 11.0,
      StatusChipSize.medium => 12.0,
      StatusChipSize.large => 14.0,
    };

    final iconSize = switch (size) {
      StatusChipSize.small => 12.0,
      StatusChipSize.medium => 14.0,
      StatusChipSize.large => 16.0,
    };

    Widget chip = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.2 : 0.12),
        borderRadius: BorderRadius.circular(size == StatusChipSize.large ? 10 : 8),
        border: Border.all(
          color: color.withValues(alpha: isDark ? 0.4 : 0.2),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            Icon(
              _getStatusIcon(status),
              size: iconSize,
              color: color,
            ),
            SizedBox(width: size == StatusChipSize.small ? 4 : 6),
          ],
          Text(
            displayLabel,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: fontSize,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );

    if (animate && _shouldPulse(status)) {
      return _PulsingChip(child: chip);
    }

    return chip;
  }

  IconData _getStatusIcon(String? status) {
    switch (status) {
      case 'DELIVERED_TO_CUSTOMER':
        return Icons.check_circle_outline;
      case 'CANCELLED':
        return Icons.cancel_outlined;
      case 'ON_HOLD':
        return Icons.pause_circle_outline;
      case 'OFFLINE_PENDING':
        return Icons.cloud_off_outlined;
      case 'PURCHASED':
        return Icons.shopping_bag_outlined;
      case 'PACKED_READY':
        return Icons.inventory_2_outlined;
      case 'DISPATCHED_TO_FACTORY':
        return Icons.local_shipping_outlined;
      case 'RECEIVED_AT_FACTORY':
        return Icons.factory_outlined;
      case 'RETURNED_FROM_FACTORY':
        return Icons.keyboard_return_outlined;
      case 'RECEIVED_AT_SHOP':
        return Icons.store_outlined;
      case 'ADDED_TO_STOCK':
        return Icons.inventory_outlined;
      case 'HANDED_TO_DELIVERY':
        return Icons.delivery_dining_outlined;
      default:
        return Icons.circle_outlined;
    }
  }

  bool _shouldPulse(String? status) {
    return status == 'OFFLINE_PENDING' || status == 'ON_HOLD';
  }
}

enum StatusChipSize { small, medium, large }

class _PulsingChip extends StatefulWidget {
  const _PulsingChip({required this.child});

  final Widget child;

  @override
  State<_PulsingChip> createState() => _PulsingChipState();
}

class _PulsingChipState extends State<_PulsingChip> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 1.0, end: 0.6).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) => Opacity(
        opacity: _animation.value,
        child: child,
      ),
      child: widget.child,
    );
  }
}

/// Dual status display showing current and next status
class StatusTransition extends StatelessWidget {
  const StatusTransition({
    super.key,
    required this.currentStatus,
    this.nextStatus,
    this.size = StatusChipSize.medium,
  });

  final String? currentStatus;
  final String? nextStatus;
  final StatusChipSize size;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Current',
              style: textTheme.labelSmall?.copyWith(
                color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5),
                fontSize: 10,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            StatusChip(status: currentStatus, size: size),
          ],
        ),
        if (nextStatus != null) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Icon(
              Icons.arrow_forward,
              size: 16,
              color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.4),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Next',
                style: textTheme.labelSmall?.copyWith(
                  color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5),
                  fontSize: 10,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 4),
              StatusChip(status: nextStatus, size: size),
            ],
          ),
        ],
      ],
    );
  }
}
