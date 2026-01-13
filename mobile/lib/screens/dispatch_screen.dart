import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/screens/scan_screen.dart';

class DispatchScreen extends StatelessWidget {
  const DispatchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dispatch')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Create or select batch in admin panel for now.'),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Scan to DISPATCHED_TO_FACTORY'),
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
