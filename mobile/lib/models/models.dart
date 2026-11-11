class AppUser {
  final int id;
  final String username;
  final String email;
  final String? fullName;
  final String role;
  final bool isActive;

  const AppUser({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    required this.isActive,
    this.fullName,
  });

  bool get isAdmin => role == 'admin';

  String get displayName {
    if (fullName != null && fullName!.trim().isNotEmpty) return fullName!.trim();
    return username;
  }

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: (json['id'] as num?)?.toInt() ?? 0,
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      fullName: json['full_name'] as String?,
      role: json['role'] as String? ?? 'viewer',
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

class AuthResult {
  final String accessToken;

  const AuthResult({required this.accessToken});

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(accessToken: json['access_token'] as String? ?? '');
  }
}

class SourceEvidence {
  final String document;
  final String chunk;
  final double score;

  const SourceEvidence({
    required this.document,
    required this.chunk,
    required this.score,
  });

  factory SourceEvidence.fromJson(Map<String, dynamic> json) {
    return SourceEvidence(
      document: json['document'] as String? ?? 'unknown',
      chunk: json['chunk'] as String? ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0,
    );
  }
}

class ChatAnswer {
  final String question;
  final String answer;
  final List<SourceEvidence> sources;
  final double confidence;

  const ChatAnswer({
    required this.question,
    required this.answer,
    required this.sources,
    required this.confidence,
  });

  factory ChatAnswer.fromJson(Map<String, dynamic> json) {
    final rawSources = json['sources'];
    return ChatAnswer(
      question: json['question'] as String? ?? '',
      answer: json['answer'] as String? ?? '',
      sources: rawSources is List
          ? rawSources
              .whereType<Map>()
              .map((item) => SourceEvidence.fromJson(
                    Map<String, dynamic>.from(item),
                  ))
              .toList()
          : const [],
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
    );
  }
}

class UiMessage {
  final String role; // user | assistant | error
  final String content;
  final List<SourceEvidence> sources;
  final double? confidence;
  final DateTime createdAt;

  UiMessage({
    required this.role,
    required this.content,
    this.sources = const [],
    this.confidence,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  bool get isUser => role == 'user';
  bool get isError => role == 'error';

  factory UiMessage.user(String text) => UiMessage(role: 'user', content: text);

  factory UiMessage.assistant(ChatAnswer answer) => UiMessage(
        role: 'assistant',
        content: answer.answer,
        sources: answer.sources,
        confidence: answer.confidence,
      );

  factory UiMessage.error(String text) => UiMessage(role: 'error', content: text);
}

class Supplier {
  final int id;
  final String name;
  final String? contactPerson;
  final String? email;
  final String? phone;
  final String? address;
  final String? category;
  final String status;
  final String riskLevel;
  final double? deliveryScore;
  final double? qualityScore;
  final String? evaluationNotes;
  final DateTime? createdAt;

  const Supplier({
    required this.id,
    required this.name,
    required this.status,
    required this.riskLevel,
    this.contactPerson,
    this.email,
    this.phone,
    this.address,
    this.category,
    this.deliveryScore,
    this.qualityScore,
    this.evaluationNotes,
    this.createdAt,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) {
    return Supplier(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: json['name'] as String? ?? 'Unknown supplier',
      contactPerson: json['contact_person'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      category: json['category'] as String?,
      status: json['status'] as String? ?? 'active',
      riskLevel: json['risk_level'] as String? ?? 'low',
      deliveryScore: (json['delivery_score'] as num?)?.toDouble(),
      qualityScore: (json['quality_score'] as num?)?.toDouble(),
      evaluationNotes: json['evaluation_notes'] as String?,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? ''),
    );
  }

  double get averageScore {
    final values = [deliveryScore, qualityScore].whereType<double>().toList();
    if (values.isEmpty) return 0;
    return values.reduce((a, b) => a + b) / values.length;
  }
}

class RiskAssessment {
  final int supplierId;
  final String supplierName;
  final String riskLevel;
  final double riskScore;
  final List<String> factors;

  const RiskAssessment({
    required this.supplierId,
    required this.supplierName,
    required this.riskLevel,
    required this.riskScore,
    required this.factors,
  });

  factory RiskAssessment.fromJson(Map<String, dynamic> json) {
    final rawFactors = json['factors'];
    return RiskAssessment(
      supplierId: (json['supplier_id'] as num?)?.toInt() ?? 0,
      supplierName: json['supplier_name'] as String? ?? '',
      riskLevel: json['risk_level'] as String? ?? 'low',
      riskScore: (json['risk_score'] as num?)?.toDouble() ?? 0,
      factors: rawFactors is List ? rawFactors.map((e) => '$e').toList() : const [],
    );
  }
}

class ProcurementDocument {
  final int id;
  final String originalFilename;
  final String fileType;
  final int fileSize;
  final String? description;
  final int chunkCount;
  final DateTime? createdAt;

  const ProcurementDocument({
    required this.id,
    required this.originalFilename,
    required this.fileType,
    required this.fileSize,
    required this.chunkCount,
    this.description,
    this.createdAt,
  });

  factory ProcurementDocument.fromJson(Map<String, dynamic> json) {
    return ProcurementDocument(
      id: (json['id'] as num?)?.toInt() ?? 0,
      originalFilename: json['original_filename'] as String? ?? 'document',
      fileType: json['file_type'] as String? ?? 'txt',
      fileSize: (json['file_size'] as num?)?.toInt() ?? 0,
      description: json['description'] as String?,
      chunkCount: (json['chunk_count'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? ''),
    );
  }
}

class HealthStatus {
  final String status;
  final String version;
  final String database;
  final String chromadb;
  final String gemini;

  const HealthStatus({
    required this.status,
    required this.version,
    required this.database,
    required this.chromadb,
    required this.gemini,
  });

  factory HealthStatus.fromJson(Map<String, dynamic> json) {
    return HealthStatus(
      status: json['status'] as String? ?? 'unknown',
      version: json['version'] as String? ?? '-',
      database: json['database'] as String? ?? 'unknown',
      chromadb: json['chromadb'] as String? ?? 'unknown',
      gemini: json['gemini'] as String? ?? 'unknown',
    );
  }
}
