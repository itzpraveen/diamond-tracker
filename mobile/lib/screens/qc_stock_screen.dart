import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/screens/scan_screen.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';

class QcStockScreen extends StatelessWidget {
  const QcStockScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return MajesticScaffold(
      title: 'QC / Stock',
      child: ListView(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Quality Control', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  const Text('Confirm receipt, stock intake, and delivery handoff.'),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ScanScreen(targetStatus: 'RECEIVED_AT_SHOP')),
                      ),
                      child: const Text('Scan Receive at Shop'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ScanScreen(targetStatus: 'ADDED_TO_STOCK')),
                      ),
                      child: const Text('Scan Add to Stock'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ScanScreen(targetStatus: 'HANDED_TO_DELIVERY')),
                      ),
                      child: const Text('Scan Handed to Delivery'),
                    ),
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
