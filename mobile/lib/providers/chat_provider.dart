import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/api_service.dart';

class ChatProvider extends ChangeNotifier {
  ChatProvider(this._api);

  final ApiService _api;

  final List<UiMessage> _messages = [];
  bool _sending = false;

  List<UiMessage> get messages => List.unmodifiable(_messages);
  bool get sending => _sending;
  bool get isEmpty => _messages.isEmpty;

  Future<void> send(String question) async {
    final text = question.trim();
    if (text.isEmpty || _sending) return;

    _messages.add(UiMessage.user(text));
    _sending = true;
    notifyListeners();

    try {
      final answer = await _api.chat(text);
      _messages.add(UiMessage.assistant(answer));
    } on ApiException catch (error) {
      _messages.add(UiMessage.error(error.message));
    } catch (_) {
      _messages.add(UiMessage.error('Something went wrong. Please try again.'));
    } finally {
      _sending = false;
      notifyListeners();
    }
  }

  void clear() {
    _messages.clear();
    notifyListeners();
  }
}
