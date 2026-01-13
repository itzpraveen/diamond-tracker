import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/screens/scan_screen.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';

class DispatchScreen extends StatelessWidget {
  const DispatchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return MajesticScaffold(
      title: 'Dispatch',
      child: ListView(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Dispatch Overview', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  const Text('Create or select a batch in the admin panel before scanning items.'),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.qr_code_scanner),
                      label: const Text('Scan to DISPATCHED_TO_FACTORY'),
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ScanScreen()),
                      ),
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
