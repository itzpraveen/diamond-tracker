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

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final role = authState.role;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Majestic Tracking'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          )
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text('Quick Scan'),
              subtitle: const Text('Scan label to move to next status'),
              trailing: const Icon(Icons.qr_code_scanner),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ScanScreen()),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              title: const Text('Lookup / Search'),
              subtitle: const Text('Find job details & timeline'),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LookupScreen()),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              title: const Text('Report Incident'),
              subtitle: const Text('Mismatch, damage, duplicate scan'),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const IncidentScreen()),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              title: const Text('Sync Queue'),
              subtitle: const Text('Attempt to sync offline scans'),
              trailing: const Icon(Icons.sync),
              onTap: () => ref.read(syncServiceProvider).syncQueue(),
            ),
          ),
          const SizedBox(height: 24),
          Text('Role Actions', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
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

  Widget _navTile(BuildContext context, String title, Widget screen) {
    return Card(
      child: ListTile(
        title: Text(title),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
      ),
    );
  }
}
