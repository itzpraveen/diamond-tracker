import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/screens/scan_screen.dart';

class FactoryScreen extends StatelessWidget {
  const FactoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Factory')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Scan items when received and when returned.'),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Scan Factory Actions'),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ScanScreen()),
            ),
          )
        ],
      ),
    );
  }
}
