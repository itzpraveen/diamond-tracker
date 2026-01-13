import 'dart:convert';

import 'package:drift/drift.dart' as drift;

import 'package:diamond_tracker_mobile/data/api_client.dart';
import 'package:diamond_tracker_mobile/data/local_db.dart';

class SyncService {
  SyncService({required this.db, required this.api});

  final AppDatabase db;
  final ApiClient api;

  Future<void> syncQueue() async {
    final queue = await db.pendingQueue();
    for (final item in queue) {
      try {
        final payload = jsonDecode(item.payload) as Map<String, dynamic>;
        await api.scanJob(item.jobId, payload);
        await db.markQueueSynced(item.id);
      } catch (error) {
        await db.addSyncFailure(item.id, error.toString());
      }
    }
  }
}
