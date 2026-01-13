import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/screens/scan_screen.dart';

class QcStockScreen extends StatelessWidget {
  const QcStockScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('QC / Stock')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ElevatedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ScanScreen(targetStatus: 'RECEIVED_AT_SHOP')),
            ),
            child: const Text('Scan Receive at Shop'),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ScanScreen(targetStatus: 'ADDED_TO_STOCK')),
            ),
            child: const Text('Scan Add to Stock'),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ScanScreen(targetStatus: 'HANDED_TO_DELIVERY')),
            ),
            child: const Text('Scan Handed to Delivery'),
          )
        ],
      ),
    );
  }
}
