# SmartProcure AI — Mobile

Flutter client for the SmartProcure AI backend. Material 3 dark theme.

## Features

| Tab | What it does |
| --- | --- |
| **Home** | Live supplier/document counters, backend health, supplier risk summary |
| **AI Chat** | RAG Q&A with confidence badge, expandable sources, typing indicator |
| **Suppliers** | Search, risk filters, delivery/quality scores, risk assessment sheet |
| **Docs** | Document list; upload and delete for admins only |
| **Settings** | Profile, API endpoint, sign out |

## Run

```bash
flutter pub get
flutter analyze
flutter test

# Android emulator (host machine is 10.0.2.2)
flutter run

# Physical device / remote API
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8000
```

### Web

The web runner is generated on demand:

```bash
flutter create --platforms=web .
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8000
```

## Demo accounts

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | full access |
| `viewer` | `viewer123` | read-only |

## Structure

```
lib/
├── config/       # API base URL (dart-define aware)
├── models/       # JSON models
├── providers/    # Auth, chat, suppliers, documents
├── screens/      # Login, home, dashboard, chat, suppliers, documents, settings
├── services/     # HTTP client + secure token storage
├── theme/        # Material 3 dark theme
├── utils/        # Formatters
├── widgets/      # Shared UI
└── main.dart
```
