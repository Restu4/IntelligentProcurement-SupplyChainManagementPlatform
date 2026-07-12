# User Manual
## SmartProcure AI — End User Guide

---

## 1. Getting Started

### 1.1 Accessing the Platform
1. Open your web browser and navigate to `http://smartprocure.example.com`
2. You will see the SmartProcure AI login screen
3. Enter your credentials and click **Sign In**

**Demo Credentials:**
- Username: `admin`
- Password: `admin123`

### 1.2 First Look
After logging in, you'll see the Dashboard — your central command center for procurement operations.

---

## 2. Dashboard

The Dashboard provides a comprehensive overview of your procurement landscape.

### 2.1 Key Metrics
- **Total Budget** — Overall procurement budget
- **Budget Remaining** — Unallocated funds
- **Total Suppliers** — Number of registered suppliers
- **High Risk Suppliers** — Suppliers flagged as high risk
- **Purchase Orders** — Total PO count
- **Avg Procurement Time** — Average processing duration

### 2.2 Charts
- **Monthly Spending** — Area chart showing actual vs forecast spending
- **Forecast Trend** — Projected growth indicator
- **Supplier Health** — Breakdown by risk level

### 2.3 Quick Actions
- Upload Document — Add new procurement documents
- Create PO — Create a purchase order
- Run Forecast — Generate AI predictions
- Generate Report — Export procurement reports

---

## 3. AI Assistant

The AI Assistant is the core RAG-powered chatbot that answers questions about your procurement knowledge base.

### 3.1 Asking Questions
1. Navigate to **AI Assistant** in the sidebar
2. Type your question in the input field at the bottom
3. Press **Enter** or click **Send**

**Example Questions:**
- "Who is the best supplier?"
- "What are the approval limits?"
- "What is the SLA for delivery?"
- "What penalties apply for late delivery?"

### 3.2 Understanding Responses
Each AI response includes:
- **Answer** — AI-generated response based on your documents
- **Confidence Score** — Numerical confidence (0-100%)
- **Sources** — Expand to see source document excerpts
- **Copy** — Copy the answer to clipboard
- **Regenerate** — Generate a new response

### 3.3 Confidence Indicators
| Color | Range | Meaning |
|-------|-------|---------|
| 🟢 Green | 80-100% | High confidence answer |
| 🟡 Yellow | 60-79% | Moderate confidence |
| 🔴 Red | < 60% | Low confidence — may not be reliable |

### 3.4 Hallucination Protection
If the AI cannot find relevant information:
> "I'm sorry, this information does not exist in the SmartProcure Knowledge Base."

---

## 4. Supplier Intelligence

### 4.1 Viewing Suppliers
1. Navigate to **Supplier Intelligence**
2. View all suppliers in a table with performance metrics
3. Use the search bar to find specific suppliers

### 4.2 Understanding Supplier Metrics
- **Delivery Score** — Timeliness of deliveries (0-100%)
- **Quality Score** — Quality of goods/services (0-100%)
- **Risk Level** — AI-classified risk (Low / Medium / High)
- **Status** — Active or Inactive

### 4.3 Risk Assessment
SmartProcure AI automatically classifies supplier risk based on:
- Delivery performance
- Quality scores
- Late delivery ratio

---

## 5. Budget Tracker

### 5.1 Viewing Budgets
1. Navigate to **Budget Tracker**
2. See budget allocation across departments
3. View utilization percentage with visual indicators

### 5.2 Understanding Budget Status
| Color | Meaning |
|-------|---------|
| 🟢 Green | Healthy (< 70% utilized) |
| 🟡 Yellow | Warning (70-85% utilized) |
| 🔴 Red | Critical (> 85% utilized) |

---

## 6. Forecast

### 6.1 Price Forecast
SmartProcure AI analyzes historical price data to predict future prices using linear regression.

**View:**
1. Navigate to **Forecast**
2. See historical prices (actual) vs predicted prices
3. View confidence interval and buy recommendation

### 6.2 Smart Buy Recommendation
The system calculates a composite score for each supplier based on:
- Delivery score (40% weight)
- Quality score (40% weight)
- Price competitiveness (20% weight)

---

## 7. Knowledge Base

### 7.1 Uploading Documents
1. Navigate to **Knowledge Base**
2. Drag & drop files or click **Browse Files**
3. Supported formats: PDF, DOCX, TXT
4. Maximum file size: 20 MB

### 7.2 Processing Pipeline
After upload, the system automatically:
1. Extracts text from the document
2. Splits text into chunks (500 chars with 100 overlap)
3. Generates vector embeddings
4. Stores in ChromaDB for semantic search

---

## 8. Reports

### 8.1 Generating Reports
1. Navigate to **Reports**
2. Click on report type (Procurement Summary, Supplier Performance, etc.)
3. Download as PDF or Excel

---

## 9. Settings

### 9.1 Profile Settings
- Update your name, email, and role
- Manage notification preferences
- Configure security settings

### 9.2 Theme Toggle
- Click the sun/moon icon in the top bar
- Toggle between Dark and Light mode

---

## 10. Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus chat input | `Ctrl + K` |
| New chat | `Ctrl + N` |
| Toggle sidebar | `Ctrl + B` |
| Toggle theme | `Ctrl + T` |
