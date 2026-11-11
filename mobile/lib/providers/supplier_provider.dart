import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/api_service.dart';

class SupplierProvider extends ChangeNotifier {
  SupplierProvider(this._api);

  final ApiService _api;

  List<Supplier> _suppliers = [];
  bool _loading = false;
  String? _error;
  String _query = '';
  String _riskFilter = 'all';

  List<Supplier> get suppliers => List.unmodifiable(_suppliers);
  bool get loading => _loading;
  String? get error => _error;
  String get query => _query;
  String get riskFilter => _riskFilter;

  List<Supplier> get filtered {
    final term = _query.trim().toLowerCase();
    return _suppliers.where((supplier) {
      final matchesQuery = term.isEmpty ||
          supplier.name.toLowerCase().contains(term) ||
          (supplier.category ?? '').toLowerCase().contains(term) ||
          (supplier.contactPerson ?? '').toLowerCase().contains(term);
      final matchesRisk =
          _riskFilter == 'all' || supplier.riskLevel == _riskFilter;
      return matchesQuery && matchesRisk;
    }).toList();
  }

  int get activeCount =>
      _suppliers.where((supplier) => supplier.status == 'active').length;

  int get highRiskCount =>
      _suppliers.where((supplier) => supplier.riskLevel == 'high').length;

  void setQuery(String value) {
    _query = value;
    notifyListeners();
  }

  void setRiskFilter(String value) {
    _riskFilter = value;
    notifyListeners();
  }

  Future<void> load({bool silent = false}) async {
    if (!silent) {
      _loading = true;
      _error = null;
      notifyListeners();
    }

    try {
      _suppliers = await _api.suppliers();
      _error = null;
    } on ApiException catch (error) {
      _error = error.message;
    } catch (_) {
      _error = 'Failed to load suppliers.';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<RiskAssessment> assessRisk(int supplierId) {
    return _api.supplierRisk(supplierId);
  }
}
