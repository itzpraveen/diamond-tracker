import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  ApiClient({Dio? dio, FlutterSecureStorage? storage})
      : _dio = dio ?? Dio(BaseOptions(baseUrl: _defaultBaseUrl())),
        _storage = storage ?? const FlutterSecureStorage() {
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) async {
      final accessToken = await _storage.read(key: 'access_token');
      if (accessToken != null) {
        options.headers['Authorization'] = 'Bearer $accessToken';
      }
      return handler.next(options);
    }));
  }

  final Dio _dio;
  final FlutterSecureStorage _storage;

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

  Future<List<dynamic>> listJobs({String? query}) async {
    final response = await _dio.get('/jobs', queryParameters: query != null ? {'job_id': query} : null);
    return response.data as List<dynamic>;
  }

  Future<List<dynamic>> listBatches() async {
    final response = await _dio.get('/batches');
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
}
