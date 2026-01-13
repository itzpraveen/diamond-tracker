// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'local_db.dart';

// ignore_for_file: type=lint
class $LocalJobsTable extends LocalJobs
    with TableInfo<$LocalJobsTable, LocalJob> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalJobsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _jobIdMeta = const VerificationMeta('jobId');
  @override
  late final GeneratedColumn<String> jobId = GeneratedColumn<String>(
      'job_id', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints: GeneratedColumn.constraintIsAlways('UNIQUE'));
  static const VerificationMeta _dataMeta = const VerificationMeta('data');
  @override
  late final GeneratedColumn<String> data = GeneratedColumn<String>(
      'data', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [id, jobId, data, status, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_jobs';
  @override
  VerificationContext validateIntegrity(Insertable<LocalJob> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('job_id')) {
      context.handle(
          _jobIdMeta, jobId.isAcceptableOrUnknown(data['job_id']!, _jobIdMeta));
    } else if (isInserting) {
      context.missing(_jobIdMeta);
    }
    if (data.containsKey('data')) {
      context.handle(
          _dataMeta, this.data.isAcceptableOrUnknown(data['data']!, _dataMeta));
    } else if (isInserting) {
      context.missing(_dataMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalJob map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalJob(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      jobId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}job_id'])!,
      data: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}data'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
    );
  }

  @override
  $LocalJobsTable createAlias(String alias) {
    return $LocalJobsTable(attachedDatabase, alias);
  }
}

class LocalJob extends DataClass implements Insertable<LocalJob> {
  final int id;
  final String jobId;
  final String data;
  final String status;
  final DateTime updatedAt;
  const LocalJob(
      {required this.id,
      required this.jobId,
      required this.data,
      required this.status,
      required this.updatedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['job_id'] = Variable<String>(jobId);
    map['data'] = Variable<String>(data);
    map['status'] = Variable<String>(status);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalJobsCompanion toCompanion(bool nullToAbsent) {
    return LocalJobsCompanion(
      id: Value(id),
      jobId: Value(jobId),
      data: Value(data),
      status: Value(status),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalJob.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalJob(
      id: serializer.fromJson<int>(json['id']),
      jobId: serializer.fromJson<String>(json['jobId']),
      data: serializer.fromJson<String>(json['data']),
      status: serializer.fromJson<String>(json['status']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'jobId': serializer.toJson<String>(jobId),
      'data': serializer.toJson<String>(data),
      'status': serializer.toJson<String>(status),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalJob copyWith(
          {int? id,
          String? jobId,
          String? data,
          String? status,
          DateTime? updatedAt}) =>
      LocalJob(
        id: id ?? this.id,
        jobId: jobId ?? this.jobId,
        data: data ?? this.data,
        status: status ?? this.status,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  LocalJob copyWithCompanion(LocalJobsCompanion data) {
    return LocalJob(
      id: data.id.present ? data.id.value : this.id,
      jobId: data.jobId.present ? data.jobId.value : this.jobId,
      data: data.data.present ? data.data.value : this.data,
      status: data.status.present ? data.status.value : this.status,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalJob(')
          ..write('id: $id, ')
          ..write('jobId: $jobId, ')
          ..write('data: $data, ')
          ..write('status: $status, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, jobId, data, status, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalJob &&
          other.id == this.id &&
          other.jobId == this.jobId &&
          other.data == this.data &&
          other.status == this.status &&
          other.updatedAt == this.updatedAt);
}

class LocalJobsCompanion extends UpdateCompanion<LocalJob> {
  final Value<int> id;
  final Value<String> jobId;
  final Value<String> data;
  final Value<String> status;
  final Value<DateTime> updatedAt;
  const LocalJobsCompanion({
    this.id = const Value.absent(),
    this.jobId = const Value.absent(),
    this.data = const Value.absent(),
    this.status = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  LocalJobsCompanion.insert({
    this.id = const Value.absent(),
    required String jobId,
    required String data,
    required String status,
    required DateTime updatedAt,
  })  : jobId = Value(jobId),
        data = Value(data),
        status = Value(status),
        updatedAt = Value(updatedAt);
  static Insertable<LocalJob> custom({
    Expression<int>? id,
    Expression<String>? jobId,
    Expression<String>? data,
    Expression<String>? status,
    Expression<DateTime>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (jobId != null) 'job_id': jobId,
      if (data != null) 'data': data,
      if (status != null) 'status': status,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  LocalJobsCompanion copyWith(
      {Value<int>? id,
      Value<String>? jobId,
      Value<String>? data,
      Value<String>? status,
      Value<DateTime>? updatedAt}) {
    return LocalJobsCompanion(
      id: id ?? this.id,
      jobId: jobId ?? this.jobId,
      data: data ?? this.data,
      status: status ?? this.status,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (jobId.present) {
      map['job_id'] = Variable<String>(jobId.value);
    }
    if (data.present) {
      map['data'] = Variable<String>(data.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalJobsCompanion(')
          ..write('id: $id, ')
          ..write('jobId: $jobId, ')
          ..write('data: $data, ')
          ..write('status: $status, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $LocalPhotosTable extends LocalPhotos
    with TableInfo<$LocalPhotosTable, LocalPhoto> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalPhotosTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _jobIdMeta = const VerificationMeta('jobId');
  @override
  late final GeneratedColumn<String> jobId = GeneratedColumn<String>(
      'job_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _pathMeta = const VerificationMeta('path');
  @override
  late final GeneratedColumn<String> path = GeneratedColumn<String>(
      'path', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _uploadedMeta =
      const VerificationMeta('uploaded');
  @override
  late final GeneratedColumn<bool> uploaded = GeneratedColumn<bool>(
      'uploaded', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("uploaded" IN (0, 1))'),
      defaultValue: const Constant(false));
  @override
  List<GeneratedColumn> get $columns => [id, jobId, path, uploaded];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_photos';
  @override
  VerificationContext validateIntegrity(Insertable<LocalPhoto> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('job_id')) {
      context.handle(
          _jobIdMeta, jobId.isAcceptableOrUnknown(data['job_id']!, _jobIdMeta));
    } else if (isInserting) {
      context.missing(_jobIdMeta);
    }
    if (data.containsKey('path')) {
      context.handle(
          _pathMeta, path.isAcceptableOrUnknown(data['path']!, _pathMeta));
    } else if (isInserting) {
      context.missing(_pathMeta);
    }
    if (data.containsKey('uploaded')) {
      context.handle(_uploadedMeta,
          uploaded.isAcceptableOrUnknown(data['uploaded']!, _uploadedMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalPhoto map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalPhoto(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      jobId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}job_id'])!,
      path: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}path'])!,
      uploaded: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}uploaded'])!,
    );
  }

  @override
  $LocalPhotosTable createAlias(String alias) {
    return $LocalPhotosTable(attachedDatabase, alias);
  }
}

class LocalPhoto extends DataClass implements Insertable<LocalPhoto> {
  final int id;
  final String jobId;
  final String path;
  final bool uploaded;
  const LocalPhoto(
      {required this.id,
      required this.jobId,
      required this.path,
      required this.uploaded});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['job_id'] = Variable<String>(jobId);
    map['path'] = Variable<String>(path);
    map['uploaded'] = Variable<bool>(uploaded);
    return map;
  }

  LocalPhotosCompanion toCompanion(bool nullToAbsent) {
    return LocalPhotosCompanion(
      id: Value(id),
      jobId: Value(jobId),
      path: Value(path),
      uploaded: Value(uploaded),
    );
  }

  factory LocalPhoto.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalPhoto(
      id: serializer.fromJson<int>(json['id']),
      jobId: serializer.fromJson<String>(json['jobId']),
      path: serializer.fromJson<String>(json['path']),
      uploaded: serializer.fromJson<bool>(json['uploaded']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'jobId': serializer.toJson<String>(jobId),
      'path': serializer.toJson<String>(path),
      'uploaded': serializer.toJson<bool>(uploaded),
    };
  }

  LocalPhoto copyWith({int? id, String? jobId, String? path, bool? uploaded}) =>
      LocalPhoto(
        id: id ?? this.id,
        jobId: jobId ?? this.jobId,
        path: path ?? this.path,
        uploaded: uploaded ?? this.uploaded,
      );
  LocalPhoto copyWithCompanion(LocalPhotosCompanion data) {
    return LocalPhoto(
      id: data.id.present ? data.id.value : this.id,
      jobId: data.jobId.present ? data.jobId.value : this.jobId,
      path: data.path.present ? data.path.value : this.path,
      uploaded: data.uploaded.present ? data.uploaded.value : this.uploaded,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalPhoto(')
          ..write('id: $id, ')
          ..write('jobId: $jobId, ')
          ..write('path: $path, ')
          ..write('uploaded: $uploaded')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, jobId, path, uploaded);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalPhoto &&
          other.id == this.id &&
          other.jobId == this.jobId &&
          other.path == this.path &&
          other.uploaded == this.uploaded);
}

class LocalPhotosCompanion extends UpdateCompanion<LocalPhoto> {
  final Value<int> id;
  final Value<String> jobId;
  final Value<String> path;
  final Value<bool> uploaded;
  const LocalPhotosCompanion({
    this.id = const Value.absent(),
    this.jobId = const Value.absent(),
    this.path = const Value.absent(),
    this.uploaded = const Value.absent(),
  });
  LocalPhotosCompanion.insert({
    this.id = const Value.absent(),
    required String jobId,
    required String path,
    this.uploaded = const Value.absent(),
  })  : jobId = Value(jobId),
        path = Value(path);
  static Insertable<LocalPhoto> custom({
    Expression<int>? id,
    Expression<String>? jobId,
    Expression<String>? path,
    Expression<bool>? uploaded,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (jobId != null) 'job_id': jobId,
      if (path != null) 'path': path,
      if (uploaded != null) 'uploaded': uploaded,
    });
  }

  LocalPhotosCompanion copyWith(
      {Value<int>? id,
      Value<String>? jobId,
      Value<String>? path,
      Value<bool>? uploaded}) {
    return LocalPhotosCompanion(
      id: id ?? this.id,
      jobId: jobId ?? this.jobId,
      path: path ?? this.path,
      uploaded: uploaded ?? this.uploaded,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (jobId.present) {
      map['job_id'] = Variable<String>(jobId.value);
    }
    if (path.present) {
      map['path'] = Variable<String>(path.value);
    }
    if (uploaded.present) {
      map['uploaded'] = Variable<bool>(uploaded.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalPhotosCompanion(')
          ..write('id: $id, ')
          ..write('jobId: $jobId, ')
          ..write('path: $path, ')
          ..write('uploaded: $uploaded')
          ..write(')'))
        .toString();
  }
}

class $ScanQueueTable extends ScanQueue
    with TableInfo<$ScanQueueTable, ScanQueueData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ScanQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _jobIdMeta = const VerificationMeta('jobId');
  @override
  late final GeneratedColumn<String> jobId = GeneratedColumn<String>(
      'job_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _toStatusMeta =
      const VerificationMeta('toStatus');
  @override
  late final GeneratedColumn<String> toStatus = GeneratedColumn<String>(
      'to_status', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
      'payload', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _syncedMeta = const VerificationMeta('synced');
  @override
  late final GeneratedColumn<bool> synced = GeneratedColumn<bool>(
      'synced', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("synced" IN (0, 1))'),
      defaultValue: const Constant(false));
  @override
  List<GeneratedColumn> get $columns =>
      [id, jobId, toStatus, payload, createdAt, synced];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'scan_queue';
  @override
  VerificationContext validateIntegrity(Insertable<ScanQueueData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('job_id')) {
      context.handle(
          _jobIdMeta, jobId.isAcceptableOrUnknown(data['job_id']!, _jobIdMeta));
    } else if (isInserting) {
      context.missing(_jobIdMeta);
    }
    if (data.containsKey('to_status')) {
      context.handle(_toStatusMeta,
          toStatus.isAcceptableOrUnknown(data['to_status']!, _toStatusMeta));
    } else if (isInserting) {
      context.missing(_toStatusMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('synced')) {
      context.handle(_syncedMeta,
          synced.isAcceptableOrUnknown(data['synced']!, _syncedMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ScanQueueData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ScanQueueData(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      jobId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}job_id'])!,
      toStatus: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}to_status'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      synced: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}synced'])!,
    );
  }

  @override
  $ScanQueueTable createAlias(String alias) {
    return $ScanQueueTable(attachedDatabase, alias);
  }
}

class ScanQueueData extends DataClass implements Insertable<ScanQueueData> {
  final int id;
  final String jobId;
  final String toStatus;
  final String payload;
  final DateTime createdAt;
  final bool synced;
  const ScanQueueData(
      {required this.id,
      required this.jobId,
      required this.toStatus,
      required this.payload,
      required this.createdAt,
      required this.synced});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['job_id'] = Variable<String>(jobId);
    map['to_status'] = Variable<String>(toStatus);
    map['payload'] = Variable<String>(payload);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['synced'] = Variable<bool>(synced);
    return map;
  }

  ScanQueueCompanion toCompanion(bool nullToAbsent) {
    return ScanQueueCompanion(
      id: Value(id),
      jobId: Value(jobId),
      toStatus: Value(toStatus),
      payload: Value(payload),
      createdAt: Value(createdAt),
      synced: Value(synced),
    );
  }

  factory ScanQueueData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ScanQueueData(
      id: serializer.fromJson<int>(json['id']),
      jobId: serializer.fromJson<String>(json['jobId']),
      toStatus: serializer.fromJson<String>(json['toStatus']),
      payload: serializer.fromJson<String>(json['payload']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      synced: serializer.fromJson<bool>(json['synced']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'jobId': serializer.toJson<String>(jobId),
      'toStatus': serializer.toJson<String>(toStatus),
      'payload': serializer.toJson<String>(payload),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'synced': serializer.toJson<bool>(synced),
    };
  }

  ScanQueueData copyWith(
          {int? id,
          String? jobId,
          String? toStatus,
          String? payload,
          DateTime? createdAt,
          bool? synced}) =>
      ScanQueueData(
        id: id ?? this.id,
        jobId: jobId ?? this.jobId,
        toStatus: toStatus ?? this.toStatus,
        payload: payload ?? this.payload,
        createdAt: createdAt ?? this.createdAt,
        synced: synced ?? this.synced,
      );
  ScanQueueData copyWithCompanion(ScanQueueCompanion data) {
    return ScanQueueData(
      id: data.id.present ? data.id.value : this.id,
      jobId: data.jobId.present ? data.jobId.value : this.jobId,
      toStatus: data.toStatus.present ? data.toStatus.value : this.toStatus,
      payload: data.payload.present ? data.payload.value : this.payload,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      synced: data.synced.present ? data.synced.value : this.synced,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ScanQueueData(')
          ..write('id: $id, ')
          ..write('jobId: $jobId, ')
          ..write('toStatus: $toStatus, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt, ')
          ..write('synced: $synced')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, jobId, toStatus, payload, createdAt, synced);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ScanQueueData &&
          other.id == this.id &&
          other.jobId == this.jobId &&
          other.toStatus == this.toStatus &&
          other.payload == this.payload &&
          other.createdAt == this.createdAt &&
          other.synced == this.synced);
}

class ScanQueueCompanion extends UpdateCompanion<ScanQueueData> {
  final Value<int> id;
  final Value<String> jobId;
  final Value<String> toStatus;
  final Value<String> payload;
  final Value<DateTime> createdAt;
  final Value<bool> synced;
  const ScanQueueCompanion({
    this.id = const Value.absent(),
    this.jobId = const Value.absent(),
    this.toStatus = const Value.absent(),
    this.payload = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.synced = const Value.absent(),
  });
  ScanQueueCompanion.insert({
    this.id = const Value.absent(),
    required String jobId,
    required String toStatus,
    required String payload,
    required DateTime createdAt,
    this.synced = const Value.absent(),
  })  : jobId = Value(jobId),
        toStatus = Value(toStatus),
        payload = Value(payload),
        createdAt = Value(createdAt);
  static Insertable<ScanQueueData> custom({
    Expression<int>? id,
    Expression<String>? jobId,
    Expression<String>? toStatus,
    Expression<String>? payload,
    Expression<DateTime>? createdAt,
    Expression<bool>? synced,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (jobId != null) 'job_id': jobId,
      if (toStatus != null) 'to_status': toStatus,
      if (payload != null) 'payload': payload,
      if (createdAt != null) 'created_at': createdAt,
      if (synced != null) 'synced': synced,
    });
  }

  ScanQueueCompanion copyWith(
      {Value<int>? id,
      Value<String>? jobId,
      Value<String>? toStatus,
      Value<String>? payload,
      Value<DateTime>? createdAt,
      Value<bool>? synced}) {
    return ScanQueueCompanion(
      id: id ?? this.id,
      jobId: jobId ?? this.jobId,
      toStatus: toStatus ?? this.toStatus,
      payload: payload ?? this.payload,
      createdAt: createdAt ?? this.createdAt,
      synced: synced ?? this.synced,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (jobId.present) {
      map['job_id'] = Variable<String>(jobId.value);
    }
    if (toStatus.present) {
      map['to_status'] = Variable<String>(toStatus.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (synced.present) {
      map['synced'] = Variable<bool>(synced.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ScanQueueCompanion(')
          ..write('id: $id, ')
          ..write('jobId: $jobId, ')
          ..write('toStatus: $toStatus, ')
          ..write('payload: $payload, ')
          ..write('createdAt: $createdAt, ')
          ..write('synced: $synced')
          ..write(')'))
        .toString();
  }
}

class $SyncFailuresTable extends SyncFailures
    with TableInfo<$SyncFailuresTable, SyncFailure> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncFailuresTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _queueIdMeta =
      const VerificationMeta('queueId');
  @override
  late final GeneratedColumn<int> queueId = GeneratedColumn<int>(
      'queue_id', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _errorMeta = const VerificationMeta('error');
  @override
  late final GeneratedColumn<String> error = GeneratedColumn<String>(
      'error', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [id, queueId, error, createdAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_failures';
  @override
  VerificationContext validateIntegrity(Insertable<SyncFailure> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('queue_id')) {
      context.handle(_queueIdMeta,
          queueId.isAcceptableOrUnknown(data['queue_id']!, _queueIdMeta));
    } else if (isInserting) {
      context.missing(_queueIdMeta);
    }
    if (data.containsKey('error')) {
      context.handle(
          _errorMeta, error.isAcceptableOrUnknown(data['error']!, _errorMeta));
    } else if (isInserting) {
      context.missing(_errorMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncFailure map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncFailure(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      queueId: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}queue_id'])!,
      error: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}error'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $SyncFailuresTable createAlias(String alias) {
    return $SyncFailuresTable(attachedDatabase, alias);
  }
}

class SyncFailure extends DataClass implements Insertable<SyncFailure> {
  final int id;
  final int queueId;
  final String error;
  final DateTime createdAt;
  const SyncFailure(
      {required this.id,
      required this.queueId,
      required this.error,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['queue_id'] = Variable<int>(queueId);
    map['error'] = Variable<String>(error);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  SyncFailuresCompanion toCompanion(bool nullToAbsent) {
    return SyncFailuresCompanion(
      id: Value(id),
      queueId: Value(queueId),
      error: Value(error),
      createdAt: Value(createdAt),
    );
  }

  factory SyncFailure.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncFailure(
      id: serializer.fromJson<int>(json['id']),
      queueId: serializer.fromJson<int>(json['queueId']),
      error: serializer.fromJson<String>(json['error']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'queueId': serializer.toJson<int>(queueId),
      'error': serializer.toJson<String>(error),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  SyncFailure copyWith(
          {int? id, int? queueId, String? error, DateTime? createdAt}) =>
      SyncFailure(
        id: id ?? this.id,
        queueId: queueId ?? this.queueId,
        error: error ?? this.error,
        createdAt: createdAt ?? this.createdAt,
      );
  SyncFailure copyWithCompanion(SyncFailuresCompanion data) {
    return SyncFailure(
      id: data.id.present ? data.id.value : this.id,
      queueId: data.queueId.present ? data.queueId.value : this.queueId,
      error: data.error.present ? data.error.value : this.error,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncFailure(')
          ..write('id: $id, ')
          ..write('queueId: $queueId, ')
          ..write('error: $error, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, queueId, error, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncFailure &&
          other.id == this.id &&
          other.queueId == this.queueId &&
          other.error == this.error &&
          other.createdAt == this.createdAt);
}

class SyncFailuresCompanion extends UpdateCompanion<SyncFailure> {
  final Value<int> id;
  final Value<int> queueId;
  final Value<String> error;
  final Value<DateTime> createdAt;
  const SyncFailuresCompanion({
    this.id = const Value.absent(),
    this.queueId = const Value.absent(),
    this.error = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  SyncFailuresCompanion.insert({
    this.id = const Value.absent(),
    required int queueId,
    required String error,
    required DateTime createdAt,
  })  : queueId = Value(queueId),
        error = Value(error),
        createdAt = Value(createdAt);
  static Insertable<SyncFailure> custom({
    Expression<int>? id,
    Expression<int>? queueId,
    Expression<String>? error,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (queueId != null) 'queue_id': queueId,
      if (error != null) 'error': error,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  SyncFailuresCompanion copyWith(
      {Value<int>? id,
      Value<int>? queueId,
      Value<String>? error,
      Value<DateTime>? createdAt}) {
    return SyncFailuresCompanion(
      id: id ?? this.id,
      queueId: queueId ?? this.queueId,
      error: error ?? this.error,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (queueId.present) {
      map['queue_id'] = Variable<int>(queueId.value);
    }
    if (error.present) {
      map['error'] = Variable<String>(error.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncFailuresCompanion(')
          ..write('id: $id, ')
          ..write('queueId: $queueId, ')
          ..write('error: $error, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $LocalJobsTable localJobs = $LocalJobsTable(this);
  late final $LocalPhotosTable localPhotos = $LocalPhotosTable(this);
  late final $ScanQueueTable scanQueue = $ScanQueueTable(this);
  late final $SyncFailuresTable syncFailures = $SyncFailuresTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities =>
      [localJobs, localPhotos, scanQueue, syncFailures];
}

typedef $$LocalJobsTableCreateCompanionBuilder = LocalJobsCompanion Function({
  Value<int> id,
  required String jobId,
  required String data,
  required String status,
  required DateTime updatedAt,
});
typedef $$LocalJobsTableUpdateCompanionBuilder = LocalJobsCompanion Function({
  Value<int> id,
  Value<String> jobId,
  Value<String> data,
  Value<String> status,
  Value<DateTime> updatedAt,
});

class $$LocalJobsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalJobsTable> {
  $$LocalJobsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get jobId => $composableBuilder(
      column: $table.jobId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get data => $composableBuilder(
      column: $table.data, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnFilters(column));
}

class $$LocalJobsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalJobsTable> {
  $$LocalJobsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get jobId => $composableBuilder(
      column: $table.jobId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get data => $composableBuilder(
      column: $table.data, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
      column: $table.updatedAt, builder: (column) => ColumnOrderings(column));
}

class $$LocalJobsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalJobsTable> {
  $$LocalJobsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get jobId =>
      $composableBuilder(column: $table.jobId, builder: (column) => column);

  GeneratedColumn<String> get data =>
      $composableBuilder(column: $table.data, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalJobsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalJobsTable,
    LocalJob,
    $$LocalJobsTableFilterComposer,
    $$LocalJobsTableOrderingComposer,
    $$LocalJobsTableAnnotationComposer,
    $$LocalJobsTableCreateCompanionBuilder,
    $$LocalJobsTableUpdateCompanionBuilder,
    (LocalJob, BaseReferences<_$AppDatabase, $LocalJobsTable, LocalJob>),
    LocalJob,
    PrefetchHooks Function()> {
  $$LocalJobsTableTableManager(_$AppDatabase db, $LocalJobsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalJobsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalJobsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalJobsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> jobId = const Value.absent(),
            Value<String> data = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
          }) =>
              LocalJobsCompanion(
            id: id,
            jobId: jobId,
            data: data,
            status: status,
            updatedAt: updatedAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String jobId,
            required String data,
            required String status,
            required DateTime updatedAt,
          }) =>
              LocalJobsCompanion.insert(
            id: id,
            jobId: jobId,
            data: data,
            status: status,
            updatedAt: updatedAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalJobsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalJobsTable,
    LocalJob,
    $$LocalJobsTableFilterComposer,
    $$LocalJobsTableOrderingComposer,
    $$LocalJobsTableAnnotationComposer,
    $$LocalJobsTableCreateCompanionBuilder,
    $$LocalJobsTableUpdateCompanionBuilder,
    (LocalJob, BaseReferences<_$AppDatabase, $LocalJobsTable, LocalJob>),
    LocalJob,
    PrefetchHooks Function()>;
typedef $$LocalPhotosTableCreateCompanionBuilder = LocalPhotosCompanion
    Function({
  Value<int> id,
  required String jobId,
  required String path,
  Value<bool> uploaded,
});
typedef $$LocalPhotosTableUpdateCompanionBuilder = LocalPhotosCompanion
    Function({
  Value<int> id,
  Value<String> jobId,
  Value<String> path,
  Value<bool> uploaded,
});

class $$LocalPhotosTableFilterComposer
    extends Composer<_$AppDatabase, $LocalPhotosTable> {
  $$LocalPhotosTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get jobId => $composableBuilder(
      column: $table.jobId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get path => $composableBuilder(
      column: $table.path, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get uploaded => $composableBuilder(
      column: $table.uploaded, builder: (column) => ColumnFilters(column));
}

class $$LocalPhotosTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalPhotosTable> {
  $$LocalPhotosTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get jobId => $composableBuilder(
      column: $table.jobId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get path => $composableBuilder(
      column: $table.path, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get uploaded => $composableBuilder(
      column: $table.uploaded, builder: (column) => ColumnOrderings(column));
}

class $$LocalPhotosTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalPhotosTable> {
  $$LocalPhotosTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get jobId =>
      $composableBuilder(column: $table.jobId, builder: (column) => column);

  GeneratedColumn<String> get path =>
      $composableBuilder(column: $table.path, builder: (column) => column);

  GeneratedColumn<bool> get uploaded =>
      $composableBuilder(column: $table.uploaded, builder: (column) => column);
}

class $$LocalPhotosTableTableManager extends RootTableManager<
    _$AppDatabase,
    $LocalPhotosTable,
    LocalPhoto,
    $$LocalPhotosTableFilterComposer,
    $$LocalPhotosTableOrderingComposer,
    $$LocalPhotosTableAnnotationComposer,
    $$LocalPhotosTableCreateCompanionBuilder,
    $$LocalPhotosTableUpdateCompanionBuilder,
    (LocalPhoto, BaseReferences<_$AppDatabase, $LocalPhotosTable, LocalPhoto>),
    LocalPhoto,
    PrefetchHooks Function()> {
  $$LocalPhotosTableTableManager(_$AppDatabase db, $LocalPhotosTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalPhotosTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalPhotosTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalPhotosTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> jobId = const Value.absent(),
            Value<String> path = const Value.absent(),
            Value<bool> uploaded = const Value.absent(),
          }) =>
              LocalPhotosCompanion(
            id: id,
            jobId: jobId,
            path: path,
            uploaded: uploaded,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String jobId,
            required String path,
            Value<bool> uploaded = const Value.absent(),
          }) =>
              LocalPhotosCompanion.insert(
            id: id,
            jobId: jobId,
            path: path,
            uploaded: uploaded,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$LocalPhotosTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $LocalPhotosTable,
    LocalPhoto,
    $$LocalPhotosTableFilterComposer,
    $$LocalPhotosTableOrderingComposer,
    $$LocalPhotosTableAnnotationComposer,
    $$LocalPhotosTableCreateCompanionBuilder,
    $$LocalPhotosTableUpdateCompanionBuilder,
    (LocalPhoto, BaseReferences<_$AppDatabase, $LocalPhotosTable, LocalPhoto>),
    LocalPhoto,
    PrefetchHooks Function()>;
typedef $$ScanQueueTableCreateCompanionBuilder = ScanQueueCompanion Function({
  Value<int> id,
  required String jobId,
  required String toStatus,
  required String payload,
  required DateTime createdAt,
  Value<bool> synced,
});
typedef $$ScanQueueTableUpdateCompanionBuilder = ScanQueueCompanion Function({
  Value<int> id,
  Value<String> jobId,
  Value<String> toStatus,
  Value<String> payload,
  Value<DateTime> createdAt,
  Value<bool> synced,
});

class $$ScanQueueTableFilterComposer
    extends Composer<_$AppDatabase, $ScanQueueTable> {
  $$ScanQueueTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get jobId => $composableBuilder(
      column: $table.jobId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get toStatus => $composableBuilder(
      column: $table.toStatus, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get synced => $composableBuilder(
      column: $table.synced, builder: (column) => ColumnFilters(column));
}

class $$ScanQueueTableOrderingComposer
    extends Composer<_$AppDatabase, $ScanQueueTable> {
  $$ScanQueueTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get jobId => $composableBuilder(
      column: $table.jobId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get toStatus => $composableBuilder(
      column: $table.toStatus, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get synced => $composableBuilder(
      column: $table.synced, builder: (column) => ColumnOrderings(column));
}

class $$ScanQueueTableAnnotationComposer
    extends Composer<_$AppDatabase, $ScanQueueTable> {
  $$ScanQueueTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get jobId =>
      $composableBuilder(column: $table.jobId, builder: (column) => column);

  GeneratedColumn<String> get toStatus =>
      $composableBuilder(column: $table.toStatus, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<bool> get synced =>
      $composableBuilder(column: $table.synced, builder: (column) => column);
}

class $$ScanQueueTableTableManager extends RootTableManager<
    _$AppDatabase,
    $ScanQueueTable,
    ScanQueueData,
    $$ScanQueueTableFilterComposer,
    $$ScanQueueTableOrderingComposer,
    $$ScanQueueTableAnnotationComposer,
    $$ScanQueueTableCreateCompanionBuilder,
    $$ScanQueueTableUpdateCompanionBuilder,
    (
      ScanQueueData,
      BaseReferences<_$AppDatabase, $ScanQueueTable, ScanQueueData>
    ),
    ScanQueueData,
    PrefetchHooks Function()> {
  $$ScanQueueTableTableManager(_$AppDatabase db, $ScanQueueTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ScanQueueTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ScanQueueTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ScanQueueTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<String> jobId = const Value.absent(),
            Value<String> toStatus = const Value.absent(),
            Value<String> payload = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<bool> synced = const Value.absent(),
          }) =>
              ScanQueueCompanion(
            id: id,
            jobId: jobId,
            toStatus: toStatus,
            payload: payload,
            createdAt: createdAt,
            synced: synced,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required String jobId,
            required String toStatus,
            required String payload,
            required DateTime createdAt,
            Value<bool> synced = const Value.absent(),
          }) =>
              ScanQueueCompanion.insert(
            id: id,
            jobId: jobId,
            toStatus: toStatus,
            payload: payload,
            createdAt: createdAt,
            synced: synced,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$ScanQueueTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $ScanQueueTable,
    ScanQueueData,
    $$ScanQueueTableFilterComposer,
    $$ScanQueueTableOrderingComposer,
    $$ScanQueueTableAnnotationComposer,
    $$ScanQueueTableCreateCompanionBuilder,
    $$ScanQueueTableUpdateCompanionBuilder,
    (
      ScanQueueData,
      BaseReferences<_$AppDatabase, $ScanQueueTable, ScanQueueData>
    ),
    ScanQueueData,
    PrefetchHooks Function()>;
typedef $$SyncFailuresTableCreateCompanionBuilder = SyncFailuresCompanion
    Function({
  Value<int> id,
  required int queueId,
  required String error,
  required DateTime createdAt,
});
typedef $$SyncFailuresTableUpdateCompanionBuilder = SyncFailuresCompanion
    Function({
  Value<int> id,
  Value<int> queueId,
  Value<String> error,
  Value<DateTime> createdAt,
});

class $$SyncFailuresTableFilterComposer
    extends Composer<_$AppDatabase, $SyncFailuresTable> {
  $$SyncFailuresTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get queueId => $composableBuilder(
      column: $table.queueId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get error => $composableBuilder(
      column: $table.error, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$SyncFailuresTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncFailuresTable> {
  $$SyncFailuresTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get queueId => $composableBuilder(
      column: $table.queueId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get error => $composableBuilder(
      column: $table.error, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$SyncFailuresTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncFailuresTable> {
  $$SyncFailuresTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get queueId =>
      $composableBuilder(column: $table.queueId, builder: (column) => column);

  GeneratedColumn<String> get error =>
      $composableBuilder(column: $table.error, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$SyncFailuresTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SyncFailuresTable,
    SyncFailure,
    $$SyncFailuresTableFilterComposer,
    $$SyncFailuresTableOrderingComposer,
    $$SyncFailuresTableAnnotationComposer,
    $$SyncFailuresTableCreateCompanionBuilder,
    $$SyncFailuresTableUpdateCompanionBuilder,
    (
      SyncFailure,
      BaseReferences<_$AppDatabase, $SyncFailuresTable, SyncFailure>
    ),
    SyncFailure,
    PrefetchHooks Function()> {
  $$SyncFailuresTableTableManager(_$AppDatabase db, $SyncFailuresTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncFailuresTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncFailuresTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncFailuresTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<int> id = const Value.absent(),
            Value<int> queueId = const Value.absent(),
            Value<String> error = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
          }) =>
              SyncFailuresCompanion(
            id: id,
            queueId: queueId,
            error: error,
            createdAt: createdAt,
          ),
          createCompanionCallback: ({
            Value<int> id = const Value.absent(),
            required int queueId,
            required String error,
            required DateTime createdAt,
          }) =>
              SyncFailuresCompanion.insert(
            id: id,
            queueId: queueId,
            error: error,
            createdAt: createdAt,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$SyncFailuresTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $SyncFailuresTable,
    SyncFailure,
    $$SyncFailuresTableFilterComposer,
    $$SyncFailuresTableOrderingComposer,
    $$SyncFailuresTableAnnotationComposer,
    $$SyncFailuresTableCreateCompanionBuilder,
    $$SyncFailuresTableUpdateCompanionBuilder,
    (
      SyncFailure,
      BaseReferences<_$AppDatabase, $SyncFailuresTable, SyncFailure>
    ),
    SyncFailure,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$LocalJobsTableTableManager get localJobs =>
      $$LocalJobsTableTableManager(_db, _db.localJobs);
  $$LocalPhotosTableTableManager get localPhotos =>
      $$LocalPhotosTableTableManager(_db, _db.localPhotos);
  $$ScanQueueTableTableManager get scanQueue =>
      $$ScanQueueTableTableManager(_db, _db.scanQueue);
  $$SyncFailuresTableTableManager get syncFailures =>
      $$SyncFailuresTableTableManager(_db, _db.syncFailures);
}
