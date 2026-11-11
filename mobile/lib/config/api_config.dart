import 'package:flutter/foundation.dart';

/// Resolves the backend base URL.
///
/// Override it at build/run time:
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8000
class ApiConfig {
  static const String _override = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_override.isNotEmpty) {
      return _override.replaceAll(RegExp(r'/+$'), '');
    }
    if (kIsWeb) return 'http://localhost:8000';
    if (defaultTargetPlatform == TargetPlatform.android) {
      // Android emulator maps the host machine to 10.0.2.2
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }
}
