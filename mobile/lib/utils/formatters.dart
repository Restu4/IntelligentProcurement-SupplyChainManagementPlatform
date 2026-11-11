import 'package:intl/intl.dart';

class Formatters {
  static final NumberFormat _currency = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  static const List<String> _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  static String currency(num? value) {
    if (value == null) return '-';
    return _currency.format(value);
  }

  static String compactCurrency(num? value) {
    if (value == null) return '-';
    final abs = value.abs();
    if (abs >= 1000000000000) {
      return 'Rp ${(value / 1000000000000).toStringAsFixed(1)} T';
    }
    if (abs >= 1000000000) {
      return 'Rp ${(value / 1000000000).toStringAsFixed(1)} B';
    }
    if (abs >= 1000000) {
      return 'Rp ${(value / 1000000).toStringAsFixed(1)} M';
    }
    return _currency.format(value);
  }

  static String score(num? value) {
    if (value == null) return '-';
    return value.toStringAsFixed(1);
  }

  static String date(DateTime? value) {
    if (value == null) return '-';
    final local = value.toLocal();
    return '${local.day.toString().padLeft(2, '0')} '
        '${_months[local.month - 1]} ${local.year}';
  }

  static String time(DateTime? value) {
    if (value == null) return '-';
    final local = value.toLocal();
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  static String fileSize(int bytes) {
    if (bytes >= 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    if (bytes >= 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
    return '$bytes B';
  }

  static DateTime? parseDate(String? value) {
    if (value == null || value.isEmpty) return null;
    return DateTime.tryParse(value);
  }
}
