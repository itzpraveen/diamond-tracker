import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'local_db.g.dart';

class LocalJobs extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get jobId => text().unique()();
  TextColumn get data => text()();
  TextColumn get status => text()();
  DateTimeColumn get updatedAt => dateTime()();
}

class LocalPhotos extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get jobId => text()();
  TextColumn get path => text()();
  BoolColumn get uploaded => boolean().withDefault(const Constant(false))();
}

class ScanQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get jobId => text()();
  TextColumn get toStatus => text()();
  TextColumn get payload => text()();
  DateTimeColumn get createdAt => dateTime()();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
}

class SyncFailures extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get queueId => integer()();
  TextColumn get error => text()();
  DateTimeColumn get createdAt => dateTime()();
}

@DriftDatabase(tables: [LocalJobs, LocalPhotos, ScanQueue, SyncFailures])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'diamond_db'));

  @override
  int get schemaVersion => 1;

  Future<void> upsertJob(String jobId, Map<String, dynamic> data) async {
    final entry = LocalJobsCompanion(
      jobId: Value(jobId),
      data: Value(jsonEncode(data)),
      status: Value(data['current_status']?.toString() ?? 'PURCHASED'),
      updatedAt: Value(DateTime.now()),
    );
    await into(localJobs).insertOnConflictUpdate(entry);
  }

  Future<List<LocalJob>> getJobs() => select(localJobs).get();

  Future<void> enqueueScan(String jobId, String toStatus, Map<String, dynamic> payload) async {
    await into(scanQueue).insert(
      ScanQueueCompanion(
        jobId: Value(jobId),
        toStatus: Value(toStatus),
        payload: Value(jsonEncode(payload)),
        createdAt: Value(DateTime.now()),
      ),
    );
  }

  Future<List<ScanQueueData>> pendingQueue() {
    return (select(scanQueue)..where((tbl) => tbl.synced.equals(false))).get();
  }

  Future<void> markQueueSynced(int id) async {
    await (update(scanQueue)..where((tbl) => tbl.id.equals(id))).write(
      const ScanQueueCompanion(synced: Value(true)),
    );
  }

  Future<void> addSyncFailure(int queueId, String error) async {
    await into(syncFailures).insert(
      SyncFailuresCompanion(
        queueId: Value(queueId),
        error: Value(error),
        createdAt: Value(DateTime.now()),
      ),
    );
  }
}
