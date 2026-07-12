# Entity Relationship Diagram (ERD)
## SmartProcure AI — Database Design Document

---

## 1. Entity Overview

| Entity | Description |
|--------|-------------|
| `users` | System users with authentication |
| `suppliers` | Supplier master data |
| `purchase_orders` | Procurement purchase orders |
| `budgets` | Department budget allocations |
| `documents` | Uploaded procurement documents |
| `document_chunks` | Chunked text segments of documents |
| `embedding_metadata` | Vector embedding metadata |
| `forecast_history` | AI forecast execution records |
| `chat_history` | User conversation history |

---

## 2. Entity Relationship Diagram (Textual)

```
┌────────────────────────────────────────────────────────────────────┐
│                           ERD DIAGRAM                              │
│                                                                     │
│  ┌─────────┐       ┌──────────────┐       ┌──────────────────┐    │
│  │  users  │1──N──►│purchase_orders│       │   documents      │    │
│  └─────────┘       └──────────────┘       └────────┬─────────┘    │
│                        │                            │              │
│                        │ 1                          │ 1            │
│                        │                            │              │
│                        ▼                            ▼              │
│                 ┌──────────────┐            ┌──────────────┐       │
│                 │  suppliers   │            │document_chunks│      │
│                 ├──────────────┤            ├──────────────┤       │
│                 │1┴───────────N│            │1┴────────────N│       │
│                 │purchase_orders            │embedding_meta│       │
│                 └──────────────┘            └──────────────┘       │
│                        │                                            │
│                        │ 1                                          │
│                        ▼                                            │
│                 ┌──────────────┐       ┌──────────────────┐        │
│                 │forecast_hist.│       │   chat_history   │        │
│                 └──────────────┘       └──────────────────┘        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       budgets                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Table Definitions

### 3.1 `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PK |
| username | VARCHAR(100) | UNIQUE, NOT NULL, INDEX |
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEX |
| hashed_password | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(255) | NULLABLE |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'viewer' |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

### 3.2 `suppliers`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PK |
| name | VARCHAR(255) | NOT NULL, INDEX |
| contact_person | VARCHAR(255) | NULLABLE |
| email | VARCHAR(255) | NULLABLE |
| phone | VARCHAR(50) | NULLABLE |
| address | TEXT | NULLABLE |
| category | VARCHAR(100) | NULLABLE |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'active' |
| risk_level | VARCHAR(50) | NULLABLE, DEFAULT 'low' |
| delivery_score | FLOAT | NULLABLE |
| quality_score | FLOAT | NULLABLE |
| evaluation_notes | TEXT | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 3.3 `purchase_orders`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PK |
| po_number | VARCHAR(100) | UNIQUE, NOT NULL, INDEX |
| supplier_id | INTEGER | FK → suppliers.id, NOT NULL |
| user_id | INTEGER | FK → users.id, NOT NULL |
| description | TEXT | NULLABLE |
| amount | FLOAT | NOT NULL, DEFAULT 0 |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'draft' |
| approval_level | VARCHAR(50) | NULLABLE |
| notes | TEXT | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 3.4 `budgets`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PK |
| department | VARCHAR(255) | NOT NULL, INDEX |
| fiscal_year | INTEGER | NOT NULL |
| total_budget | FLOAT | NOT NULL |
| allocated | FLOAT | NOT NULL |
| remaining | FLOAT | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 3.5 `documents`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PK |
| filename | VARCHAR(500) | NOT NULL |
| original_filename | VARCHAR(500) | NOT NULL |
| file_type | VARCHAR(20) | NOT NULL |
| file_size | BIGINT | NOT NULL |
| file_path | VARCHAR(1000) | NOT NULL |
| user_id | INTEGER | FK → users.id |
| description | TEXT | NULLABLE |
| chunk_count | INTEGER | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 3.6 `document_chunks`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PK |
| document_id | INTEGER | FK → documents.id, NOT NULL |
| chunk_index | INTEGER | NOT NULL |
| chunk_text | TEXT | NOT NULL |
| token_count | INTEGER | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 3.7 `embedding_metadata`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PK |
| chunk_id | INTEGER | FK → document_chunks.id, NOT NULL |
| document_id | INTEGER | FK → documents.id, NOT NULL |
| model_name | VARCHAR(255) | NOT NULL |
| dimension | INTEGER | NOT NULL |
| vector_id | VARCHAR(255) | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 3.8 `forecast_history`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PK |
| supplier_id | INTEGER | FK → suppliers.id |
| forecast_type | VARCHAR(100) | NOT NULL |
| parameters | TEXT | NULLABLE |
| result | TEXT | NULLABLE |
| confidence | FLOAT | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

### 3.9 `chat_history`
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PK |
| user_id | INTEGER | FK → users.id |
| question | TEXT | NOT NULL |
| answer | TEXT | NOT NULL |
| confidence | FLOAT | NULLABLE |
| sources_json | TEXT | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL |
| updated_at | TIMESTAMPTZ | NOT NULL |

---

## 4. Relationships

- `users` 1:N `purchase_orders` — A user creates many POs
- `users` 1:N `documents` — A user uploads many documents
- `suppliers` 1:N `purchase_orders` — A supplier can have many POs
- `suppliers` 1:N `forecast_history` — A supplier can have many forecasts
- `documents` 1:N `document_chunks` — A document is split into many chunks
- `document_chunks` 1:1 `embedding_metadata` — Each chunk has one embedding record
- `users` 1:N `chat_history` — A user has many chat messages
