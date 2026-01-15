import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:diamond_tracker_mobile/data/api_client.dart';
import 'package:diamond_tracker_mobile/models/enums.dart';
import 'package:diamond_tracker_mobile/state/providers.dart';

class AuthState {
  const AuthState({
    required this.isAuthenticated,
    this.role,
    this.isLoading = false,
    this.error,
  });

  final bool isAuthenticated;
  final Role? role;
  final bool isLoading;
  final String? error;

  AuthState copyWith({bool? isAuthenticated, Role? role, bool? isLoading, String? error}) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      role: role ?? this.role,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._api, this._storage) : super(const AuthState(isAuthenticated: false));

  final ApiClient _api;
  final FlutterSecureStorage _storage;

  Future<void> loadSession() async {
    final token = await _storage.read(key: 'access_token');
    if (token == null) {
      state = const AuthState(isAuthenticated: false);
      return;
    }
    state = AuthState(isAuthenticated: true, role: _roleFromToken(token));
  }

  Future<void> login(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.login(username, password);
      final token = await _storage.read(key: 'access_token');
      state = AuthState(isAuthenticated: true, role: _roleFromToken(token ?? ''));
    } catch (error) {
      state = AuthState(isAuthenticated: false, error: error.toString());
    }
  }

  Future<void> logout() async {
    await _api.logout();
    state = const AuthState(isAuthenticated: false);
  }

  Role? _roleFromToken(String token) {
    if (token.isEmpty) return null;
    try {
      final payload = token.split('.')[1];
      final normalized = base64.normalize(payload);
      final decoded = jsonDecode(utf8.decode(base64Url.decode(normalized))) as Map<String, dynamic>;
      final roleString = decoded['role'] as String?;
      return _roleFromString(roleString ?? '');
    } catch (_) {
      return null;
    }
  }

  Role? _roleFromString(String value) {
    switch (value) {
      case 'Admin':
        return Role.admin;
      case 'Purchase':
        return Role.purchase;
      case 'Packing':
        return Role.packing;
      case 'Dispatch':
        return Role.dispatch;
      case 'Factory':
        return Role.factory;
      case 'QC_Stock':
        return Role.qcStock;
      case 'Delivery':
        return Role.delivery;
      default:
        return null;
    }
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final api = ref.read(apiClientProvider);
  const storage = FlutterSecureStorage();
  return AuthController(api, storage);
});
