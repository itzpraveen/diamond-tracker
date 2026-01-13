import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/models/enums.dart';
import 'package:diamond_tracker_mobile/screens/delivery_screen.dart';
import 'package:diamond_tracker_mobile/screens/dispatch_screen.dart';
import 'package:diamond_tracker_mobile/screens/factory_screen.dart';
import 'package:diamond_tracker_mobile/screens/incident_screen.dart';
import 'package:diamond_tracker_mobile/screens/lookup_screen.dart';
import 'package:diamond_tracker_mobile/screens/packing_screen.dart';
import 'package:diamond_tracker_mobile/screens/purchase_entry_screen.dart';
import 'package:diamond_tracker_mobile/screens/qc_stock_screen.dart';
import 'package:diamond_tracker_mobile/screens/scan_screen.dart';
import 'package:diamond_tracker_mobile/state/auth_controller.dart';
import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final role = authState.role;
    final roleLabel = _roleLabel(role);

    return MajesticScaffold(
      title: 'Majestic Tracking',
      actions: [
        IconButton(
          icon: const Icon(Icons.logout),
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
        )
      ],
      padding: EdgeInsets.zero,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: MajesticColors.gold.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.shield, color: MajesticColors.forest),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Operational Overview', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          'Role: $roleLabel',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: MajesticColors.ink.withOpacity(0.6)),
                        ),
                      ],
                    ),
                  )
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _sectionLabel(context, 'Quick Actions'),
          const SizedBox(height: 8),
          _actionTile(
            context,
            icon: Icons.qr_code_scanner,
            title: 'Quick Scan',
            subtitle: 'Scan label to move to next status',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ScanScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _actionTile(
            context,
            icon: Icons.search,
            title: 'Lookup / Search',
            subtitle: 'Find job details & timeline',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const LookupScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _actionTile(
            context,
            icon: Icons.report_gmailerrorred,
            title: 'Report Incident',
            subtitle: 'Mismatch, damage, duplicate scan',
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const IncidentScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _actionTile(
            context,
            icon: Icons.sync,
            title: 'Sync Queue',
            subtitle: 'Attempt to sync offline scans',
            onTap: () => ref.read(syncServiceProvider).syncQueue(),
          ),
          const SizedBox(height: 20),
          _sectionLabel(context, 'Role Actions'),
          const SizedBox(height: 8),
          if (role == Role.purchase) _navTile(context, 'Purchase Entry', const PurchaseEntryScreen()),
          if (role == Role.packing) _navTile(context, 'Packing', const PackingScreen()),
          if (role == Role.dispatch) _navTile(context, 'Dispatch', const DispatchScreen()),
          if (role == Role.factory) _navTile(context, 'Factory', const FactoryScreen()),
          if (role == Role.qcStock) _navTile(context, 'QC / Stock', const QcStockScreen()),
          if (role == Role.delivery) _navTile(context, 'Delivery', const DeliveryScreen()),
        ],
      ),
    );
  }

  Widget _sectionLabel(BuildContext context, String label) {
    return Text(
      label.toUpperCase(),
      style: Theme.of(context).textTheme.labelLarge?.copyWith(
            letterSpacing: 2.2,
            color: MajesticColors.ink.withOpacity(0.55),
          ),
    );
  }

  Widget _actionTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: MajesticColors.forest.withOpacity(0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: MajesticColors.forest),
        ),
        title: Text(title, style: Theme.of(context).textTheme.titleMedium),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Widget _navTile(BuildContext context, String title, Widget screen) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        title: Text(title, style: Theme.of(context).textTheme.titleMedium),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
      ),
    );
  }

  String _roleLabel(Role? role) {
    switch (role) {
      case Role.purchase:
        return 'Purchase';
      case Role.packing:
        return 'Packing';
      case Role.dispatch:
        return 'Dispatch';
      case Role.factory:
        return 'Factory';
      case Role.qcStock:
        return 'QC / Stock';
      case Role.delivery:
        return 'Delivery';
      case Role.admin:
        return 'Admin';
      case null:
        return 'Unassigned';
    }
  }
}
