import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/data/api_client.dart';
import 'package:diamond_tracker_mobile/data/local_db.dart';
import 'package:diamond_tracker_mobile/data/repositories.dart';
import 'package:diamond_tracker_mobile/data/sync_service.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final dbProvider = Provider<AppDatabase>((ref) => AppDatabase());

final jobRepositoryProvider = Provider<JobRepository>((ref) => JobRepository(
      api: ref.read(apiClientProvider),
      db: ref.read(dbProvider),
    ));

final syncServiceProvider = Provider<SyncService>((ref) => SyncService(
      db: ref.read(dbProvider),
      api: ref.read(apiClientProvider),
    ));
