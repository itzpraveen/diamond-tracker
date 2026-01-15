import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/screens/scan_screen.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/widgets/action_card.dart';
import 'package:diamond_tracker_mobile/widgets/loading_button.dart';

class QcStockScreen extends StatelessWidget {
  const QcStockScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return MajesticScaffold(
      title: 'QC / Stock',
      child: ListView(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? [
                        MajesticColors.darkCard,
                        MajesticColors.darkSurface,
                      ]
                    : [
                        MajesticColors.success.withValues(alpha: 0.08),
                        MajesticColors.forest.withValues(alpha: 0.05),
                      ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark
                    ? MajesticColors.darkBorder
                    : MajesticColors.success.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: isDark
                        ? MajesticColors.success.withValues(alpha: 0.2)
                        : MajesticColors.success.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.verified_outlined,
                    color: MajesticColors.success,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Quality Control & Stock',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Receive, verify, stock, and hand to delivery',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Actions
          const SectionHeader(title: 'Workflow Actions'),

          _WorkflowCard(
            icon: Icons.download_outlined,
            title: 'Receive at Shop',
            subtitle: 'Item returned from factory',
            color: MajesticColors.info,
            isDark: isDark,
            onTap: () => Navigator.push(
              context,
              MajesticPageRoute(
                page: const ScanScreen(targetStatus: 'RECEIVED_AT_SHOP'),
              ),
            ),
          ),
          const SizedBox(height: 12),

          _WorkflowCard(
            icon: Icons.inventory_outlined,
            title: 'Add to Stock',
            subtitle: 'Item verified and added to inventory',
            color: MajesticColors.success,
            isDark: isDark,
            onTap: () => Navigator.push(
              context,
              MajesticPageRoute(
                page: const ScanScreen(targetStatus: 'ADDED_TO_STOCK'),
              ),
            ),
          ),
          const SizedBox(height: 12),

          _WorkflowCard(
            icon: Icons.delivery_dining_outlined,
            title: 'Hand to Delivery',
            subtitle: 'Ready for customer delivery',
            color: MajesticColors.gold,
            isDark: isDark,
            onTap: () => Navigator.push(
              context,
              MajesticPageRoute(
                page: const ScanScreen(targetStatus: 'HANDED_TO_DELIVERY'),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Quick scan
          LoadingButton(
            onPressed: () => Navigator.push(
              context,
              MajesticPageRoute(page: const ScanScreen()),
            ),
            label: 'Quick Scan',
            icon: Icons.qr_code_scanner,
            variant: LoadingButtonVariant.secondary,
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _WorkflowCard extends StatelessWidget {
  const _WorkflowCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.isDark,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: isDark ? 0.2 : 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.qr_code_scanner,
                size: 20,
                color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.3),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
