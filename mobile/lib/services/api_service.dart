import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/models.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, [this.statusCode = 0]);

  @override
  String toString() => message;
}

class ApiService {
  ApiService._();

  static final ApiService instance = ApiService._();

  final http.Client _client = http.Client();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String _tokenKey = 'smartprocure_token';
  static const Duration _timeout = Duration(seconds: 90);

  String? _token;

  bool get hasToken => _token != null && _token!.isNotEmpty;

  Future<void> loadToken() async {
    _token = await _storage.read(key: _tokenKey);
  }

  Future<void> _saveToken(String token) async {
    _token = token;
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<void> clearToken() async {
    _token = null;
    await _storage.delete(key: _tokenKey);
  }

  Map<String, String> get _headers => {
        'Accept': 'application/json',
        if (hasToken) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}$path');

  dynamic _decode(http.Response response) {
    dynamic data;
    if (response.body.isNotEmpty) {
      try {
        data = jsonDecode(response.body);
      } catch (_) {
        data = response.body;
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    throw ApiException(_messageFrom(data, response.statusCode), response.statusCode);
  }

  String _messageFrom(dynamic data, int statusCode) {
    if (data is Map && data['detail'] != null) {
      final detail = data['detail'];
      if (detail is String) return detail;
      if (detail is List) {
        return detail
            .map((item) => item is Map ? '${item['msg'] ?? item}' : '$item')
            .join(', ');
      }
    }
    if (data is String && data.trim().isNotEmpty) return data;
    return 'Request failed (HTTP $statusCode)';
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    try {
      late http.Response response;
      switch (method) {
        case 'POST':
          response = await _client
              .post(_uri(path), headers: _headers, body: jsonEncode(body ?? {}))
              .timeout(_timeout);
          break;
        case 'DELETE':
          response = await _client
              .delete(_uri(path), headers: _headers)
              .timeout(_timeout);
          break;
        case 'PUT':
          response = await _client
              .put(_uri(path), headers: _headers, body: jsonEncode(body ?? {}))
              .timeout(_timeout);
          break;
        default:
          response = await _client.get(_uri(path), headers: _headers).timeout(_timeout);
      }
      return _decode(response);
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw ApiException('The request timed out. Please try again.');
    } catch (error) {
      throw ApiException(
        'Cannot reach the API at ${ApiConfig.baseUrl}. Is the backend running?',
      );
    }
  }

  /* ------------------------------- Auth ---------------------------------- */

  Future<AppUser> login(String username, String password) async {
    final data = await _send('POST', '/api/login', body: {
      'username': username,
      'password': password,
    });
    final token = AuthResult.fromJson(Map<String, dynamic>.from(data as Map));
    if (token.accessToken.isEmpty) {
      throw ApiException('The server did not return an access token.');
    }
    await _saveToken(token.accessToken);
    return me();
  }

  Future<AppUser> me() async {
    final data = await _send('GET', '/api/me');
    return AppUser.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> logout() => clearToken();

  /* ------------------------------- Chat ---------------------------------- */

  Future<ChatAnswer> chat(String question) async {
    final data = await _send('POST', '/api/chat', body: {'question': question});
    return ChatAnswer.fromJson(Map<String, dynamic>.from(data as Map));
  }

  /* ----------------------------- Documents ------------------------------- */

  Future<List<ProcurementDocument>> documents() async {
    final data = await _send('GET', '/api/documents');
    if (data is! List) return const [];
    return data
        .whereType<Map>()
        .map((item) => ProcurementDocument.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<ProcurementDocument> uploadDocument({
    required String filename,
    required Uint8List bytes,
    String? description,
  }) async {
    try {
      final request = http.MultipartRequest('POST', _uri('/api/upload'));
      request.headers.addAll(_headers);
      request.files.add(
        http.MultipartFile.fromBytes('file', bytes, filename: filename),
      );
      if (description != null && description.trim().isNotEmpty) {
        request.fields['description'] = description.trim();
      }

      final streamed = await _client.send(request).timeout(_timeout);
      final response = await http.Response.fromStream(streamed);
      final data = _decode(response);
      return ProcurementDocument.fromJson(Map<String, dynamic>.from(data as Map));
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw ApiException('Upload timed out. Try a smaller file.');
    } catch (error) {
      throw ApiException('Upload failed: $error');
    }
  }

  Future<void> deleteDocument(int id) async {
    await _send('DELETE', '/api/documents/$id');
  }

  /* ----------------------------- Suppliers ------------------------------- */

  Future<List<Supplier>> suppliers({String? status, String? riskLevel}) async {
    final params = <String, String>{};
    if (status != null && status.isNotEmpty && status != 'all') {
      params['status'] = status;
    }
    if (riskLevel != null && riskLevel.isNotEmpty && riskLevel != 'all') {
      params['risk_level'] = riskLevel;
    }
    final query = params.isEmpty
        ? ''
        : '?${params.entries.map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}').join('&')}';

    final data = await _send('GET', '/api/suppliers$query');
    if (data is! List) return const [];
    return data
        .whereType<Map>()
        .map((item) => Supplier.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<RiskAssessment> supplierRisk(int id) async {
    final data = await _send('GET', '/api/suppliers/$id/risk');
    return RiskAssessment.fromJson(Map<String, dynamic>.from(data as Map));
  }

  /* ------------------------------ Health --------------------------------- */

  Future<HealthStatus> health() async {
    final data = await _send('GET', '/api/health');
    return HealthStatus.fromJson(Map<String, dynamic>.from(data as Map));
  }
}
