import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._api);

  final ApiService _api;

  AppUser? _user;
  bool _loading = true;
  bool _signingIn = false;
  String? _error;

  AppUser? get user => _user;
  bool get loading => _loading;
  bool get signingIn => _signingIn;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  Future<void> bootstrap() async {
    _loading = true;
    notifyListeners();

    try {
      await _api.loadToken();
      if (_api.hasToken) {
        _user = await _api.me();
      }
    } on ApiException {
      await _api.clearToken();
      _user = null;
    } catch (_) {
      _user = null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String username, String password) async {
    _signingIn = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _api.login(username.trim(), password);
      return true;
    } on ApiException catch (error) {
      _error = error.message;
      return false;
    } catch (_) {
      _error = 'Login failed. Please try again.';
      return false;
    } finally {
      _signingIn = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _api.logout();
    _user = null;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    if (_error == null) return;
    _error = null;
    notifyListeners();
  }
}
