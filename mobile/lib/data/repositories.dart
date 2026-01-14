import 'dart:convert';

import 'package:diamond_tracker_mobile/data/api_client.dart';
import 'package:diamond_tracker_mobile/data/local_db.dart';

class JobRepository {
  JobRepository({required this.api, required this.db});

  final ApiClient api;
  final AppDatabase db;

  Future<Map<String, dynamic>> createJob(Map<String, dynamic> payload, {bool offline = false}) async {
    if (offline) {
      final jobId = (payload['job_id'] as String?) ?? 'offline-${DateTime.now().millisecondsSinceEpoch}';
      final data = {
        ...payload,
        'job_id': jobId,
        'current_status': payload['current_status'] ?? 'OFFLINE_PENDING',
        'created_at': payload['created_at'] ?? DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      };
      await db.upsertJob(jobId, data);
      return data;
    }
    final job = await api.createJob(payload);
    await db.upsertJob(job['job_id'] as String, job);
    return job;
  }

  Future<Map<String, dynamic>?> getLocalJob(String jobId) async {
    final entry = await db.getJobById(jobId);
    if (entry == null) return null;
    return jsonDecode(entry.data) as Map<String, dynamic>;
  }

  Future<void> queueScan(String jobId, Map<String, dynamic> payload) async {
    await db.enqueueScan(jobId, payload['to_status'] as String, payload);
  }

  Future<Map<String, dynamic>> scanJob(String jobId, Map<String, dynamic> payload, {bool offline = false}) async {
    if (offline) {
      await queueScan(jobId, payload);
      return payload;
    }
    final result = await api.scanJob(jobId, payload);
    await db.upsertJob(jobId, result);
    return result;
  }
}
