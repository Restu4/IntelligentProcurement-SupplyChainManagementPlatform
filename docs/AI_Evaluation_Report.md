# AI Evaluation Report
## SmartProcure AI — RAG Pipeline Performance Analysis

---

## 1. Executive Summary

This report evaluates the performance of the SmartProcure AI RAG (Retrieval-Augmented Generation) pipeline, including embedding quality, vector search accuracy, LLM response quality, and hallucination prevention mechanisms.

**Overall Assessment:** The system demonstrates strong performance in retrieving and generating accurate procurement information, with an average confidence score of 87.3% and a 100% hallucination prevention rate for out-of-knowledge-base queries.

---

## 2. Evaluation Methodology

### 2.1 Test Dataset
- 3 procurement documents (supplier report, SOP, contract guidelines)
- 15 test questions across 5 categories
- 5 out-of-knowledge-base questions

### 2.2 Metrics

| Metric | Description |
|--------|-------------|
| **Precision@5** | % of relevant chunks in top 5 results |
| **Mean Reciprocal Rank (MRR)** | Average rank of first relevant result |
| **Confidence Accuracy** | Correlation between confidence and correctness |
| **Hallucination Rate** | % of fabricated answers for unknown questions |
| **Response Time** | End-to-end query latency |

---

## 3. Results

### 3.1 Retrieval Performance

| Query Type | Precision@5 | MRR | Avg Confidence |
|------------|-------------|-----|----------------|
| Supplier Evaluation | 1.0 | 1.0 | 92.3% |
| Procurement SOP | 1.0 | 1.0 | 88.7% |
| Contract Guidelines | 1.0 | 1.0 | 85.1% |
| Cross-document queries | 0.8 | 0.9 | 82.4% |
| **Average** | **0.95** | **0.975** | **87.3%** |

### 3.2 LLM Response Quality

| Metric | Score |
|--------|-------|
| Relevance to Query | 4.6 / 5.0 |
| Factual Accuracy | 4.8 / 5.0 |
| Completeness | 4.4 / 5.0 |
| Source Attribution | 5.0 / 5.0 |
| Language Quality | 4.7 / 5.0 |

### 3.3 Hallucination Prevention

| Test Scenario | Result |
|---------------|--------|
| Out-of-knowledge-base question | ✅ Correctly refused with "not exist" message |
| Confidence < 70% threshold | ✅ Blocked and returned fallback message |
| Partially relevant query | ✅ Returned with appropriate confidence |
| Ambiguous question | ✅ Addressed with available context |

**Hallucination Rate: 0%** (0 out of 5 OOD queries produced fabricated information)

### 3.4 Performance Benchmarks

| Operation | Average Time | P95 Time |
|-----------|-------------|----------|
| Embedding Generation | 0.15s | 0.22s |
| Vector Search (Top 5) | 0.08s | 0.12s |
| LLM Generation | 1.2s | 2.1s |
| **End-to-End RAG** | **1.5s** | **2.4s** |

---

## 4. Embedding Quality Analysis

| Model | Dimension | Avg Similarity Score | Notes |
|-------|-----------|---------------------|-------|
| all-MiniLM-L6-v2 | 384 | 0.87 | English-centric; earlier default |
| paraphrase-multilingual-MiniLM-L12-v2 | 384 | not measured | Current default; covers Indonesian and English |
| Alternative: all-mpnet-base-v2 | 768 | 0.91 | Higher accuracy, 3x slower |

**Decision:** the multilingual MiniLM model is the default so Indonesian
questions retrieve as well as English ones. The similarity figure above was not
re-measured for this model; it shares the 384-dimension output but its vectors
are not interchangeable with `all-MiniLM-L6-v2`, so the knowledge base must be
re-indexed when switching (`python seed_knowledge_base.py`).

---

## 5. Confidence Threshold Analysis

| Threshold | Precision | Recall | F1 Score |
|-----------|-----------|--------|----------|
| 0.50 | 0.85 | 1.0 | 0.92 |
| 0.60 | 0.92 | 0.95 | 0.93 |
| **0.70** | **0.98** | **0.90** | **0.94** |
| 0.80 | 1.0 | 0.75 | 0.86 |
| 0.90 | 1.0 | 0.50 | 0.67 |

**Selected Threshold: 0.70** — Optimal balance between precision and recall.

---

## 6. Recommendations

1. **Expand Knowledge Base:** Add more procurement documents to improve coverage
2. **Fine-tune Chunk Size:** Current 500-char chunks work well; consider overlap reduction
3. **Implement HyDE:** Hypothetical Document Embeddings for better retrieval
4. **Cache Frequent Queries:** Reduce latency for common questions
5. **Monitor Confidence Drift:** Track confidence scores over time for quality assurance
