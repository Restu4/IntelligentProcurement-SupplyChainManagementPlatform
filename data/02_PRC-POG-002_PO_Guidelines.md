# Purchase Order Issuance & Management Guidelines

| Field | Detail |
|---|---|
| **Document ID** | PRC-POG-002 |
| **Version** | 2.4 |
| **Department Owner** | Procurement Department |
| **Effective Date** | 15 January 2026 |
| **Review Cycle** | Annual |
| **Classification** | Internal – Controlled Document |
| **Approved By** | Siti Rahmawati, Head of Procurement Operations |

## Purpose

This document defines the rules and procedures governing the creation, modification, approval, and closure of Purchase Orders (POs) at PT Nusantara Manufacturing Indonesia. It ensures that all POs are accurate, properly authorized, and traceable within the SAP Ariba and SAP ERP (MM module) environment, protecting the Company from unauthorized commitments and supporting accurate financial forecasting against the annual procurement budget of Rp 3.8 trillion.

## Detailed Content

### 1. PO Types
- **Standard PO**: Single delivery, fixed quantity and price (e.g., one-time spare part purchase).
- **Blanket/Framework PO**: Used for recurring raw material supply (e.g., monthly palm oil deliveries from PT Agro Lestari Nusantara) with a validity period of up to 12 months and a not-to-exceed (NTE) value.
- **Service PO**: For contracted services such as cleaning, security, or third-party logistics (e.g., PT Sentosa Cold Chain Logistics).
- **Capital PO**: For machinery and capital expenditure, requiring Finance Capex approval in addition to Procurement approval.

### 2. PO Creation Requirements
Every PO must reference: (a) an approved Purchase Requisition number, (b) a valid supplier code from the active Vendor Master, (c) agreed Incoterms (typically FOB Jakarta or DDP plant), (d) currency (IDR for domestic, USD for selected imported raw materials), (e) payment terms (standard: Net 45 days from invoice receipt), and (f) delivery schedule with named receiving plant.

### 3. PO Approval Workflow
POs are routed automatically through SAP Ariba's approval workflow based on the Procurement Approval Matrix (PRC-PAM-008). A PO cannot be released to the supplier until all required approvals are digitally recorded. System approval bypass is technically disabled; any manual override requires IT Security and Procurement Director sign-off, logged in the Override Register.

### 4. PO Amendments
Amendments to quantity, price, or delivery date exceeding 10% of original PO value require re-approval at the original approval level. Amendments exceeding 25% of original value are treated as a new procurement event and must be re-routed through the full approval matrix, including a renewed budget check by Finance.

### 5. PO Cancellation
POs may be cancelled prior to Goods Receipt with Procurement Manager approval. Cancellation after partial delivery requires coordination with the Warehouse, Quality Assurance, and Accounts Payable to reverse any partial GR/IR postings, and must be documented with a cancellation reason code.

### 6. Goods Receipt & Three-Way Match
Warehouse personnel must create a Goods Receipt (GR) in SAP within 24 hours of physical delivery. Accounts Payable performs a three-way match between PO, GR, and supplier invoice before payment release. Price variances exceeding 2% or quantity variances exceeding 5% trigger an automatic block requiring Buyer investigation.

### 7. PO Closure
POs are automatically closed in the system after final GR and invoice settlement, or manually closed by the Buyer if no further deliveries are expected, to release any residual budget commitment back to the cost center.

## Rules

1. No goods or services shall be delivered to any PT NMI facility without a valid, approved PO number, except for documented emergency procurement per PRC-SOP-001 Section 7.
2. Split purchase orders designed to circumvent approval thresholds are strictly prohibited and constitute a compliance violation.
3. Blanket POs must be reviewed quarterly by the Category Manager to confirm continued commercial competitiveness.
4. All POs issued in foreign currency must include a currency hedging note from Treasury if value exceeds USD 100,000.
5. Verbal or email-only purchase commitments without a corresponding system PO are not recognized as binding by the Company and create personal liability risk for the issuing employee.

## Procedures

1. Buyer converts approved PR into PO draft in SAP Ariba.
2. System validates budget availability against cost center.
3. PO routed through approval workflow per PRC-PAM-008.
4. Approved PO transmitted electronically to supplier via Ariba Network.
5. Supplier confirms PO acknowledgment within 2 working days.
6. Goods/services delivered per agreed schedule.
7. Warehouse posts Goods Receipt.
8. Accounts Payable executes three-way match and schedules payment.
9. Buyer monitors open PO report weekly and closes completed POs.

## Thresholds

| PO Value (IDR) | Approval Required | Max Amendment Without Re-Approval |
|---|---|---|
| Up to Rp 25,000,000 | Procurement Manager | 10% |
| Rp 25,000,001 – Rp 150,000,000 | Senior Procurement Manager | 10% |
| Rp 150,000,001 – Rp 750,000,000 | Procurement Director | 5% |
| Above Rp 750,000,000 | CFO + Procurement Director | 5% |

## Penalties

- Issuing a PO that splits a single requirement into smaller orders to avoid threshold approval: formal disciplinary action and mandatory reporting to Internal Audit; repeated occurrence may result in termination.
- Accepting goods without a valid PO: the receiving officer and requesting department head are jointly accountable; cost may be charged back to the requesting department's discretionary budget.
- Manual override of system approval controls without dual sign-off: immediate suspension of system access pending investigation.

## Approval Levels

PO approvals follow PRC-PAM-008. Capital POs additionally require Finance Capex Committee approval regardless of value if the asset is capitalized under PSAK (Indonesian Financial Accounting Standards).

## Business Scenarios

**Scenario A**: A Buyer at the Cikarang plant needs to increase a Blanket PO with PT Wira Packaging Solutions from Rp 600,000,000 to Rp 680,000,000 (a 13% increase) due to higher-than-forecast demand for flexible packaging film. Since the change exceeds the 10% amendment threshold, the amendment must be re-routed for approval at the Procurement Director level, including updated budget justification.

**Scenario B**: A delivery of corrugated cartons from PT Karton Pak Nusantara arrives at the Surabaya warehouse without a corresponding PO number due to a miscommunication. Per Rule 1, the Warehouse must reject the delivery or hold it in quarantine pending emergency PO issuance and Procurement Manager sign-off before any Goods Receipt can be posted.
