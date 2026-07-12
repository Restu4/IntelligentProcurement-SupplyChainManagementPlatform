# Procurement Approval Matrix

| Field | Detail |
|---|---|
| **Document ID** | PRC-PAM-008 |
| **Version** | 4.0 |
| **Department Owner** | Procurement Department & Finance Department (Joint Owner) |
| **Effective Date** | 01 January 2026 |
| **Review Cycle** | Annual, or upon any organizational restructuring |
| **Classification** | Internal – Mandatory Reference Document |
| **Approved By** | Board of Directors, PT Nusantara Manufacturing Indonesia |

## Purpose

This document is the single authoritative source defining the Delegation of Authority (DOA) for all procurement transactions, contracts, and related commitments at PT Nusantara Manufacturing Indonesia. It is referenced by all other procurement policies, including PRC-SOP-001, PRC-POG-002, and PRC-CMP-005, and is configured directly into the SAP Ariba approval workflow engine.

## Detailed Content

### 1. Governing Principles
- Approval authority is tied to the individual's role, not their personal seniority or tenure — authority does not transfer informally.
- No single individual may approve their own procurement request (segregation of duties is system-enforced).
- All approval levels are cumulative: an approval at a higher band implicitly satisfies lower-band requirements but not vice versa.
- Approval authority is denominated in IDR; foreign currency transactions are converted using the Bank Indonesia (BI) reference rate on the date of PR submission.
- Delegation of authority during leave/absence must be formally assigned via the Temporary Delegation of Authority Form, valid for a maximum of 30 days, and logged with HR and IT Security.

### 2. Standard Procurement Approval Matrix (Goods & Services PO)

| Spend Band (IDR) | Approval Authority | System Role Code |
|---|---|---|
| Up to Rp 25,000,000 | Buyer / Procurement Officer | PRC-L1 |
| Rp 25,000,001 – Rp 150,000,000 | Procurement Manager | PRC-L2 |
| Rp 150,000,001 – Rp 750,000,000 | Senior Procurement Manager / Category Manager | PRC-L3 |
| Rp 750,000,001 – Rp 2,500,000,000 | Procurement Director | PRC-L4 |
| Rp 2,500,000,001 – Rp 10,000,000,000 | Chief Financial Officer + Procurement Director (dual approval) | PRC-L5 |
| Above Rp 10,000,000,000 | Chief Executive Officer + Board of Directors | PRC-L6 |

### 3. Capital Expenditure (Capex) Matrix

| Capex Value (IDR) | Approval Authority |
|---|---|
| Up to Rp 150,000,000 | Plant Manager + Procurement Manager |
| Rp 150,000,001 – Rp 1,500,000,000 | Procurement Director + Finance Director |
| Rp 1,500,000,001 – Rp 15,000,000,000 | CFO + CEO |
| Above Rp 15,000,000,000 | Board of Directors (Capex Committee review mandatory) |

### 4. Contract-Specific Approvals
Contract execution authority mirrors the standard matrix in Section 2, with the additional requirement (per PRC-CMP-005) that Legal & Contracts sign-off is mandatory above Rp 150,000,000, irrespective of Procurement-level authority.

### 5. Emergency/Exception Approvals
Emergency procurement (per PRC-SOP-001 Section 7) may be initiated by a Plant Procurement Officer up to Rp 150,000,000 without prior multi-quote sourcing, but requires retroactive Procurement Director notification within 24 hours and full documentation within 5 working days. Emergency spend above Rp 150,000,000 requires real-time verbal approval from the Procurement Director (or delegate) before commitment, followed by formal system approval within 48 hours.

### 6. New Supplier Onboarding Approval
Activation of a new vendor master record requires Category Manager approval plus Compliance & Ethics Office KYS clearance (per PRC-PCP-006), regardless of the anticipated transaction value.

### 7. Budget Reallocation
Any procurement request that would cause a cost center to exceed its approved annual budget by more than 5% requires Finance Business Partner approval in addition to the standard procurement approval level, per the Budget Control Policy (PRC-BCP-017).

## Rules

1. The system enforces hard-stop controls: a PO cannot be released to a supplier without all required approval steps digitally completed.
2. Approval cannot be granted by an individual one level below the required threshold "pending" higher approval; full approval chain must be satisfied before PO release.
3. Splitting a single business requirement into multiple smaller POs to fit within a lower approver's authority is strictly prohibited (see PRC-POG-002, Rule 2).
4. Temporary Delegation of Authority must specify an end date; the system automatically reverts authority to the original approver upon expiry.
5. Any deviation from this matrix requires written exception approval from the CFO and is logged in the DOA Exception Register, reviewed quarterly by Internal Audit.

## Procedures

1. PR/PO value calculated automatically by SAP Ariba based on total contract value (including all renewal option periods, if a multi-year framework).
2. System identifies required approval level(s) based on Sections 2–6 above.
3. Workflow routes sequentially to all required approvers; each approver receives system notification with full supporting documentation.
4. Approval or rejection is logged with timestamp and approver comments.
5. Upon full approval chain completion, PO/contract is released for execution.
6. Internal Audit performs quarterly sampling to confirm matrix compliance.

## Thresholds

(See Sections 2 and 3 tables above for complete threshold bands.)

## Penalties

- Any PO released without complete approval chain is automatically flagged by SAP Ariba's exception report; the responsible Buyer is required to provide written justification within 48 hours or the PO is cancelled.
- Deliberate circumvention of the approval matrix (including unauthorized splitting of orders) constitutes gross misconduct under the Procurement Ethics Policy (PRC-PEP-011) and may result in termination.
- Use of expired Temporary Delegation of Authority is treated as an unauthorized approval and voids the underlying transaction pending re-approval.

## Approval Levels

This document IS the approval matrix referenced throughout the procurement policy suite. Any amendment to this matrix itself requires Board of Directors approval, as it constitutes a fundamental governance control.

## Business Scenarios

**Scenario A**: A capital project to install a new packaging line at the Medan plant is estimated at Rp 18,200,000,000. Per Section 3, this exceeds Rp 15,000,000,000 and therefore requires Board of Directors approval, with mandatory review by the Capex Committee prior to the Board vote, regardless of how compelling the business case appears at the Procurement Director level.

**Scenario B**: The Procurement Director is on annual leave for 14 days during a period when a Rp 1,800,000,000 raw material contract requires approval. A Temporary Delegation of Authority Form is filed naming the Senior Procurement Manager as delegate for this specific approval band, valid for the 14-day period, logged with HR and IT Security, and automatically reverting upon the Procurement Director's return.
