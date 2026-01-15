import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/screens/scan_screen.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/widgets/action_card.dart';
import 'package:diamond_tracker_mobile/widgets/loading_button.dart';

class PackingScreen extends StatelessWidget {
  const PackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return MajesticScaffold(
      title: 'Packing',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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
                        MajesticColors.forest.withValues(alpha: 0.08),
                        MajesticColors.gold.withValues(alpha: 0.05),
                      ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark
                    ? MajesticColors.darkBorder
                    : MajesticColors.forest.withValues(alpha: 0.1),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: isDark
                        ? MajesticColors.gold.withValues(alpha: 0.2)
                        : MajesticColors.forest.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.inventory_2_outlined,
                    color: isDark ? MajesticColors.gold : MajesticColors.forest,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Packing Station',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Pack items and mark ready for dispatch',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Instructions
          const SectionHeader(title: 'Instructions'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InstructionItem(
                    number: '1',
                    text: 'Verify item details match the job ticket',
                    isDark: isDark,
                  ),
                  const SizedBox(height: 12),
                  _InstructionItem(
                    number: '2',
                    text: 'Package item securely for transport',
                    isDark: isDark,
                  ),
                  const SizedBox(height: 12),
                  _InstructionItem(
                    number: '3',
                    text: 'Scan to mark as packed and ready',
                    isDark: isDark,
                  ),
                ],
              ),
            ),
          ),
          const Spacer(),

          // Action button
          LoadingButton(
            onPressed: () => Navigator.push(
              context,
              MajesticPageRoute(page: const ScanScreen()),
            ),
            label: 'Scan to Pack',
            icon: Icons.qr_code_scanner,
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _InstructionItem extends StatelessWidget {
  const _InstructionItem({
    required this.number,
    required this.text,
    required this.isDark,
  });

  final String number;
  final String text;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: isDark
                ? MajesticColors.darkSurface
                : MajesticColors.forest.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Text(
            number,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: isDark ? MajesticColors.gold : MajesticColors.forest,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              text,
              style: theme.textTheme.bodyMedium,
            ),
          ),
        ),
      ],
    );
  }
}
