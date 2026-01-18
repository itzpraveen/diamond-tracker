import 'dart:convert';
import 'dart:io';

import 'package:diamond_tracker_mobile/data/api_client.dart';
import 'package:diamond_tracker_mobile/data/local_db.dart';

class SyncService {
  SyncService({required this.db, required this.api});

  final AppDatabase db;
  final ApiClient api;

  Future<SyncReport> syncAll() async {
    var jobsSynced = 0;
    var scansSynced = 0;
    var failures = 0;

    final offlineJobs = await db.getJobsByPrefix('offline-');
    for (final job in offlineJobs) {
      try {
        final data = jsonDecode(job.data) as Map<String, dynamic>;
        final photos = await db.getPhotos(job.jobId, uploaded: false);
        final uploads = <Map<String, dynamic>>[];
        final chunkSize = 3;
        for (var index = 0; index < photos.length; index += chunkSize) {
          final slice = photos.skip(index).take(chunkSize).toList();
          final results = await Future.wait(
            slice.map((photo) async {
              final upload = await api.uploadImage(File(photo.path));
              await db.markPhotoUploaded(photo.id);
              return upload;
            }),
          );
          uploads.addAll(results);
        }
        final payload = {
          'customer_name': data['customer_name'],
          'customer_phone': data['customer_phone'],
          'item_description': data['item_description'],
          'approximate_weight': _asDouble(data['approximate_weight']),
          'diamond_cent': _asDouble(data['diamond_cent']),
          'purchase_value': _asDouble(data['purchase_value']),
          'item_source': data['item_source'],
          'repair_type': data['repair_type'],
          'work_narration': data['work_narration'],
          'target_return_date': data['target_return_date'],
          'factory_id': data['factory_id'],
          'notes': data['notes'],
          'photos': uploads,
        };
        final created = await api.createJob(payload);
        final newJobId = created['job_id'] as String;
        await db.deleteJobById(job.jobId);
        await db.upsertJob(newJobId, created);
        await db.updatePhotoJobId(job.jobId, newJobId);
        await db.updateScanQueueJobId(job.jobId, newJobId);
        jobsSynced += 1;
      } catch (error) {
        failures += 1;
      }
    }

    final queue = await db.pendingQueue();
    for (final item in queue) {
      try {
        final payload = jsonDecode(item.payload) as Map<String, dynamic>;
        await api.scanJob(item.jobId, payload);
        await db.markQueueSynced(item.id);
        scansSynced += 1;
      } catch (error) {
        await db.addSyncFailure(item.id, error.toString());
        failures += 1;
      }
    }

    return SyncReport(jobsSynced: jobsSynced, scansSynced: scansSynced, failures: failures);
  }

  Future<SyncReport> syncQueue() => syncAll();

  double? _asDouble(Object? value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }
}

class SyncReport {
  const SyncReport({
    required this.jobsSynced,
    required this.scansSynced,
    required this.failures,
  });

  final int jobsSynced;
  final int scansSynced;
  final int failures;
}
