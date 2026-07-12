# Inventory Replenishment Policy

| Field | Detail |
|---|---|
| **Document ID** | PRC-IRP-012 |
| **Version** | 2.3 |
| **Department Owner** | Supply Chain Planning Department, in coordination with Procurement |
| **Effective Date** | 01 March 2026 |
| **Review Cycle** | Annual, with quarterly parameter review |
| **Classification** | Internal – Controlled Document |
| **Approved By** | Bambang Hartono, Supply Chain Director |

## Purpose

This policy defines the rules and procedures for replenishing raw material, packaging, and finished goods inventory across PT Nusantara Manufacturing Indonesia's distribution and manufacturing network, balancing service level targets against working capital efficiency.

## Detailed Content

### 1. Inventory Classification (ABC-XYZ Analysis)
All SKUs and raw materials are classified using ABC (value contribution) and XYZ (demand variability) analysis:
- **A items** (top 80% of value, ~20% of SKUs): e.g., palm oil derivatives, flexible packaging film — managed with tight safety stock and frequent review.
- **B items** (next 15% of value): e.g., specialty additives, secondary packaging — standard review cycle.
- **C items** (remaining 5% of value, high SKU count): e.g., MRO consumables — managed via min-max with longer review cycles to reduce administrative burden.
- **X (stable demand)**, **Y (seasonal/variable)**, **Z (irregular/unpredictable)** further refine safety stock calculation.

### 2. Replenishment Methods
- **Continuous Review (Reorder Point)**: Used for A-X items; reorder triggered automatically when stock falls to the Reorder Point (ROP), calculated as (Average Daily Usage × Lead Time) + Safety Stock.
- **Periodic Review**: Used for B and C items; stock reviewed on a fixed schedule (weekly for B, monthly for C) and replenished to target level.
- **Vendor-Managed Inventory (VMI)**: Used for select strategic suppliers (e.g., PT Wira Packaging Solutions) where the supplier monitors consumption via shared SAP data and proactively replenishes against an agreed min-max band, invoiced upon consumption.
- **Just-In-Time (JIT)**: Used for select high-volume, short-shelf-life raw materials at Cikarang, supported by daily delivery schedules from co-located suppliers.

### 3. Safety Stock Calculation
Safety stock is calculated using the formula: Safety Stock = Z-score (service level) × Standard Deviation of Demand × √(Lead Time). Standard target service level for A items is 98%, B items 95%, and C items 90%, corresponding to Z-scores of 2.05, 1.65, and 1.28 respectively.

### 4. Minimum/Maximum Stock Levels by Category

| Material Category | Min (Days of Supply) | Max (Days of Supply) | Review Frequency |
|---|---|---|---|
| Palm oil derivatives (A-X) | 14 | 30 | Daily (system) |
| Flexible packaging film (A-Y) | 21 | 45 | Weekly |
| Specialty flavor compounds (A-Z, single-source) | 35 | 60 | Weekly + Risk Review |
| Corrugated cartons (B) | 10 | 21 | Weekly |
| MRO/spare parts (C) | 30 | 90 | Monthly |

### 5. Demand Forecasting Integration
Replenishment parameters are recalculated monthly using the Sales & Operations Planning (S&OP) consensus forecast, adjusted for promotional spikes (e.g., Ramadan/Lebaran demand surge, typically +35–50% for snack and beverage categories) and new product launches.

### 6. Slow-Moving and Obsolete Inventory
Raw materials or packaging with no consumption for 90 days are flagged as Slow-Moving; no consumption for 180 days triggers Obsolescence Review with Finance for potential write-off. Obsolescence write-offs above Rp 250,000,000 require CFO approval.

### 7. Supplier Lead Time Buffer
All reorder point calculations must incorporate a minimum buffer of 20% above the supplier's contracted lead time to account for variability, unless the supplier has demonstrated OTIF performance above 97% for the trailing 4 quarters, in which case the buffer may be reduced to 10% with Category Manager approval.

## Rules

1. Reorder points must be reviewed and recalculated at minimum quarterly, or immediately upon a material change in supplier lead time or demand pattern.
2. Safety stock levels for single-source critical materials (per PRC-SRA-007 risk classification) must not be reduced without Supply Chain Director approval.
3. VMI arrangements must include a contractual cap on supplier-held inventory liability to prevent excessive working capital exposure to PT NMI.
4. Any stockout event affecting production must be logged as a Supply Chain Incident (PRC-SCI-014) within 24 hours.
5. Obsolescence write-offs must follow Finance's Inventory Write-Off Procedure and cannot be approved unilaterally by Supply Chain Planning.

## Procedures

1. Supply Chain Planning extracts consumption and forecast data from SAP APO/IBP monthly.
2. ABC-XYZ classification refreshed quarterly.
3. Reorder points and safety stock recalculated and validated against current supplier lead times.
4. System generates automatic Purchase Requisitions when stock crosses Reorder Point.
5. Buyer processes PR per PRC-SOP-001 standard procurement procedure.
6. Slow-moving/obsolete stock reviewed monthly in the Inventory Health Report, escalated to Finance as needed.

## Thresholds

| Parameter | Target |
|---|---|
| A-item service level | 98% |
| B-item service level | 95% |
| C-item service level | 90% |
| Slow-moving flag | No consumption for 90 days |
| Obsolescence review trigger | No consumption for 180 days |
| Obsolescence write-off requiring CFO approval | Above Rp 250,000,000 |

## Penalties

- Repeated stockouts (3+ in a rolling 12-month period) for any A-item attributable to inadequate safety stock calculation results in mandatory process review by Supply Chain Director and possible reassignment of planning responsibility for that category.
- Unauthorized reduction of safety stock for single-source critical materials without Supply Chain Director approval is treated as a control violation and reported to Internal Audit.
- Failure to log a stockout-driven production disruption as a Supply Chain Incident within 24 hours is a compliance gap subject to corrective action.

## Approval Levels

Standard reorder point/safety stock parameter changes: Supply Chain Planning Manager approval. Changes affecting single-source critical materials: Supply Chain Director approval. Obsolescence write-offs: per value band — up to Rp 250,000,000 by Finance Manager, above Rp 250,000,000 by CFO.

## Business Scenarios

**Scenario A**: Forecast for Lebaran 2026 indicates a 45% demand surge for instant noodle SKUs. Supply Chain Planning increases the Min/Max band for palm oil derivatives from 14–30 days to 21–40 days for the 8-week period surrounding the holiday, with Procurement coordinating increased delivery frequency with PT Agro Lestari Nusantara under the existing framework agreement.

**Scenario B**: A specialty flavor compound from Global Flavours & Fragrances Pte Ltd has had zero consumption for 95 days following a product reformulation. The item is flagged Slow-Moving in the Inventory Health Report; Supply Chain Planning coordinates with the Brand team to confirm the SKU is permanently discontinued, triggering an Obsolescence Review and, given the inventory value of Rp 310,000,000, a write-off requiring CFO approval.
