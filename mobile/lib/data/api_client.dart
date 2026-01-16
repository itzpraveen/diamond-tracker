import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  ApiClient({Dio? dio, FlutterSecureStorage? storage})
      : _dio = dio ?? Dio(BaseOptions(baseUrl: _defaultBaseUrl())),
        _refreshDio = Dio(BaseOptions(baseUrl: _defaultBaseUrl())),
        _storage = storage ?? const FlutterSecureStorage() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final accessToken = await _storage.read(key: 'access_token');
          if (accessToken != null) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          final response = error.response;
          final requestOptions = error.requestOptions;
          if (response?.statusCode != 401 || requestOptions.extra['retried'] == true) {
            return handler.next(error);
          }
          if (requestOptions.path.contains('/auth/refresh')) {
            return handler.next(error);
          }
          final refreshToken = await _storage.read(key: 'refresh_token');
          if (refreshToken == null) {
            return handler.next(error);
          }
          try {
            await _refreshTokens();
            final accessToken = await _storage.read(key: 'access_token');
            final headers = Map<String, dynamic>.from(requestOptions.headers);
            if (accessToken != null) {
              headers['Authorization'] = 'Bearer $accessToken';
            } else {
              headers.remove('Authorization');
            }
            final options = Options(
              method: requestOptions.method,
              headers: headers,
              responseType: requestOptions.responseType,
              contentType: requestOptions.contentType,
              followRedirects: requestOptions.followRedirects,
              validateStatus: requestOptions.validateStatus,
              receiveDataWhenStatusError: requestOptions.receiveDataWhenStatusError,
              extra: {...requestOptions.extra, 'retried': true},
            );
            final retryResponse = await _dio.request<dynamic>(
              requestOptions.path,
              data: requestOptions.data,
              queryParameters: requestOptions.queryParameters,
              options: options,
              cancelToken: requestOptions.cancelToken,
              onReceiveProgress: requestOptions.onReceiveProgress,
              onSendProgress: requestOptions.onSendProgress,
            );
            return handler.resolve(retryResponse);
          } catch (_) {
            return handler.next(error);
          }
        },
      ),
    );
  }

  final Dio _dio;
  final Dio _refreshDio;
  final FlutterSecureStorage _storage;
  Future<void>? _refreshFuture;

  static String _defaultBaseUrl() {
    const value = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:8000');
    return value;
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'username': username,
      'password': password,
    });
    final data = response.data as Map<String, dynamic>;
    await _storage.write(key: 'access_token', value: data['access_token']);
    await _storage.write(key: 'refresh_token', value: data['refresh_token']);
    return data;
  }

  Future<void> logout() async {
    await _storage.deleteAll();
  }

  Future<Map<String, dynamic>> getJob(String jobId) async {
    final response = await _dio.get('/jobs/$jobId');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createJob(Map<String, dynamic> payload) async {
    final response = await _dio.post('/jobs', data: payload);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> scanJob(String jobId, Map<String, dynamic> payload) async {
    final response = await _dio.post('/jobs/$jobId/scan', data: payload);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> uploadImage(File file) async {
    final filename = file.path.split('/').last;
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: filename),
    });
    final response = await _dio.post('/uploads/image', data: formData);
    return response.data as Map<String, dynamic>;
  }

  Future<List<int>> downloadLabel(String jobId) async {
    final response = await _dio.get<List<int>>(
      '/jobs/$jobId/label.pdf',
      options: Options(responseType: ResponseType.bytes),
    );
    return response.data ?? <int>[];
  }

  Future<List<dynamic>> listJobs({
    String? query,
    String? status,
    DateTime? fromDate,
    DateTime? toDate,
  }) async {
    final params = <String, dynamic>{};
    if (query != null) params['job_id'] = query;
    if (status != null) params['status'] = status;
    if (fromDate != null) params['from_date'] = fromDate.toIso8601String();
    if (toDate != null) params['to_date'] = toDate.toIso8601String();
    final response = await _dio.get('/jobs', queryParameters: params.isEmpty ? null : params);
    return response.data as List<dynamic>;
  }

  Future<List<dynamic>> listBatches() async {
    final response = await _dio.get('/batches');
    return response.data as List<dynamic>;
  }

  Future<List<dynamic>> listFactories() async {
    final response = await _dio.get('/factories');
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createBatch({int? year, int? month}) async {
    final response = await _dio.post('/batches', data: {
      if (year != null) 'year': year,
      if (month != null) 'month': month,
    });
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createIncident(Map<String, dynamic> payload) async {
    final response = await _dio.post('/incidents', data: payload);
    return response.data as Map<String, dynamic>;
  }

  Future<void> _refreshTokens() async {
    if (_refreshFuture != null) {
      return _refreshFuture!;
    }
    final future = _refreshTokensInternal();
    _refreshFuture = future;
    return future.whenComplete(() {
      if (identical(_refreshFuture, future)) {
        _refreshFuture = null;
      }
    });
  }

  Future<void> _refreshTokensInternal() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) {
      throw DioException(
        requestOptions: RequestOptions(path: '/auth/refresh'),
        error: 'Missing refresh token',
      );
    }
    final response = await _refreshDio.post('/auth/refresh', data: {
      'refresh_token': refreshToken,
    });
    final data = response.data as Map<String, dynamic>;
    await _storage.write(key: 'access_token', value: data['access_token']);
    await _storage.write(key: 'refresh_token', value: data['refresh_token']);
  }
}
