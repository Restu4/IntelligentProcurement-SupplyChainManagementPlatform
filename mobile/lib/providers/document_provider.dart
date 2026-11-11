import 'dart:typed_data';

import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/api_service.dart';

class DocumentProvider extends ChangeNotifier {
  DocumentProvider(this._api);

  final ApiService _api;

  List<ProcurementDocument> _documents = [];
  bool _loading = false;
  bool _uploading = false;
  String? _error;

  List<ProcurementDocument> get documents => List.unmodifiable(_documents);
  bool get loading => _loading;
  bool get uploading => _uploading;
  String? get error => _error;

  int get totalChunks =>
      _documents.fold(0, (total, doc) => total + doc.chunkCount);

  Future<void> load({bool silent = false}) async {
    if (!silent) {
      _loading = true;
      _error = null;
      notifyListeners();
    }

    try {
      _documents = await _api.documents();
      _error = null;
    } on ApiException catch (error) {
      _error = error.message;
    } catch (_) {
      _error = 'Failed to load documents.';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> upload({
    required String filename,
    required Uint8List bytes,
    String? description,
  }) async {
    _uploading = true;
    _error = null;
    notifyListeners();

    try {
      await _api.uploadDocument(
        filename: filename,
        bytes: bytes,
        description: description,
      );
      _documents = await _api.documents();
    } on ApiException catch (error) {
      _error = error.message;
      rethrow;
    } finally {
      _uploading = false;
      notifyListeners();
    }
  }

  Future<void> remove(int id) async {
    try {
      await _api.deleteDocument(id);
      _documents.removeWhere((doc) => doc.id == id);
      _error = null;
    } on ApiException catch (error) {
      _error = error.message;
      rethrow;
    } finally {
      notifyListeners();
    }
  }
}
