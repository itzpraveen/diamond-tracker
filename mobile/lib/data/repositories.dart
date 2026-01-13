import 'dart:convert';

import 'package:diamond_tracker_mobile/data/api_client.dart';
import 'package:diamond_tracker_mobile/data/local_db.dart';

class JobRepository {
  JobRepository({required this.api, required this.db});

  final ApiClient api;
  final AppDatabase db;

  Future<Map<String, dynamic>> createJob(Map<String, dynamic> payload, {bool offline = false}) async {
    if (offline) {
      await db.upsertJob(payload['job_id'] ?? 'offline', payload);
      return payload;
    }
    final job = await api.createJob(payload);
    await db.upsertJob(job['job_id'] as String, job);
    return job;
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
