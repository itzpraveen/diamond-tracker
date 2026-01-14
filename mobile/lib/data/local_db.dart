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

  Future<LocalJob?> getJobById(String jobId) {
    return (select(localJobs)..where((tbl) => tbl.jobId.equals(jobId))).getSingleOrNull();
  }

  Future<List<LocalJob>> getJobsByPrefix(String prefix) {
    return (select(localJobs)..where((tbl) => tbl.jobId.like('$prefix%'))).get();
  }

  Future<void> deleteJobById(String jobId) async {
    await (delete(localJobs)..where((tbl) => tbl.jobId.equals(jobId))).go();
  }

  Future<int> offlineJobCount() async {
    final countExp = localJobs.id.count();
    final query = selectOnly(localJobs)..addColumns([countExp]);
    query.where(localJobs.jobId.like('offline-%'));
    final row = await query.getSingle();
    return row.read(countExp) ?? 0;
  }

  Future<void> addPhoto(String jobId, String path) async {
    await into(localPhotos).insert(
      LocalPhotosCompanion(
        jobId: Value(jobId),
        path: Value(path),
      ),
    );
  }

  Future<List<LocalPhoto>> getPhotos(String jobId, {bool? uploaded}) {
    final query = select(localPhotos)..where((tbl) => tbl.jobId.equals(jobId));
    if (uploaded != null) {
      query.where((tbl) => tbl.uploaded.equals(uploaded));
    }
    return query.get();
  }

  Future<void> markPhotoUploaded(int id) async {
    await (update(localPhotos)..where((tbl) => tbl.id.equals(id))).write(
      const LocalPhotosCompanion(uploaded: Value(true)),
    );
  }

  Future<void> updatePhotoJobId(String fromJobId, String toJobId) async {
    await (update(localPhotos)..where((tbl) => tbl.jobId.equals(fromJobId))).write(
      LocalPhotosCompanion(jobId: Value(toJobId)),
    );
  }

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

  Future<int> pendingQueueCount() async {
    final countExp = scanQueue.id.count();
    final query = selectOnly(scanQueue)..addColumns([countExp]);
    query.where(scanQueue.synced.equals(false));
    final row = await query.getSingle();
    return row.read(countExp) ?? 0;
  }

  Future<void> updateScanQueueJobId(String fromJobId, String toJobId) async {
    await (update(scanQueue)..where((tbl) => tbl.jobId.equals(fromJobId))).write(
      ScanQueueCompanion(jobId: Value(toJobId)),
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
