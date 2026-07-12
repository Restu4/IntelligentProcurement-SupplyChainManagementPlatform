# Supply Chain Incident Report – Cikarang Plant Production Disruption

| Field | Detail |
|---|---|
| **Document ID** | PRC-SCI-014 |
| **Version** | 1.0 (Final) |
| **Department Owner** | Supply Chain Risk & Continuity Management |
| **Effective Date** | 18 April 2026 |
| **Incident Date** | 09–13 April 2026 |
| **Classification** | Internal – Confidential |
| **Prepared By** | Agus Setiawan, Supply Chain Continuity Manager |
| **Approved By** | Bambang Hartono, Supply Chain Director |

## Purpose

This report documents a supply chain incident that caused a production disruption at PT Nusantara Manufacturing Indonesia's Cikarang plant between 9–13 April 2026, analyzes root causes, and records corrective and preventive actions in line with the Company's Business Continuity Management framework.

## Detailed Content

### 1. Incident Summary
On 9 April 2026, the Cikarang plant's Line 3 and Line 5 (instant noodle production) experienced a stoppage due to a shortage of food-grade citric acid, normally supplied under a Blanket PO with PT Sinar Kimia Abadi. The shortage arose after a localized flooding event affected the access road to PSKA's Tangerang manufacturing facility, delaying an in-transit shipment of 18,000 kg by 4 days. Total production loss was estimated at 1.2 million cartons of finished product, equivalent to approximately Rp 14,400,000,000 in lost production value (based on standard cost), though no permanent customer order was lost due to existing finished goods buffer stock.

### 2. Incident Timeline

| Date/Time | Event |
|---|---|
| 08 Apr 2026, 22:00 WIB | Heavy rainfall causes flooding on access road to PSKA Tangerang facility |
| 09 Apr 2026, 06:30 WIB | PSKA notifies PT NMI Category Manager of shipment delay via email and phone |
| 09 Apr 2026, 08:00 WIB | Cikarang plant confirms current citric acid stock (4.2 days remaining) insufficient to bridge delay |
| 09 Apr 2026, 10:00 WIB | Emergency Procurement protocol activated; alternate citric acid sourced from PT Bahan Baku Sejahtera via expedited air-supported road freight from Surabaya |
| 09 Apr 2026, 18:00 WIB | Line 3 stoppage begins as buffer stock exhausted |
| 10 Apr 2026, 14:00 WIB | Line 5 stoppage begins |
| 11 Apr 2026, 09:00 WIB | Emergency shipment from PT Bahan Baku Sejahtera (6,000 kg) arrives; Line 3 restarted at 60% capacity |
| 12 Apr 2026, 16:00 WIB | PSKA's delayed original shipment arrives (flood waters receded, road reopened) |
| 13 Apr 2026, 08:00 WIB | Both lines fully restored to normal production capacity |

### 3. Root Cause Analysis (5-Why)
1. Why did production stop? Citric acid stock was exhausted before replacement supply arrived.
2. Why was stock exhausted? Safety stock was calculated at 5 days, based on standard lead time of 4 days plus 20% buffer (per PRC-IRP-012), which did not anticipate a multi-day force majeure event.
3. Why was there no immediate alternate source? PT Bahan Baku Sejahtera, the qualified backup supplier, is located in Surabaya, requiring 2 days of road freight to Cikarang, longer than the disruption window assumed in continuity planning.
4. Why was the flooding risk not anticipated? PSKA's facility is located in a known flood-prone industrial estate, but this was not flagged as a Geo Risk factor in the most recent Supplier Risk Assessment (PRC-SRA-007) at the time, despite historical flooding events in 2022 and 2023.
5. Why was historical flood data not incorporated into risk scoring? The Geo Risk scoring methodology at the time relied primarily on country/regional-level risk indices rather than facility-specific hazard data.

**Root Cause**: Inadequate facility-specific geographic risk data in supplier risk scoring, combined with safety stock parameters insufficiently buffered against multi-day force majeure scenarios for this single critical input.

### 4. Financial Impact Summary
- Lost production value: Rp 14,400,000,000 (standard cost basis)
- Emergency freight premium (air-supported expedited delivery): Rp 186,000,000
- Overtime/labor cost for production recovery shifts: Rp 94,500,000
- **Total quantified incident cost: Rp 14,680,500,000**
- No contractual penalty was claimed against PSKA, as the delay was attributable to documented force majeure (flooding), per the force majeure clause in Contract CMP-2024-0087.

### 5. Corrective and Preventive Actions

| Action | Owner | Due Date | Status |
|---|---|---|---|
| Increase citric acid safety stock from 5 to 8 days | Supply Chain Planning | 30 Apr 2026 | Completed |
| Incorporate facility-specific flood hazard mapping into Supplier Risk Assessment methodology | Procurement Risk Management | 30 Jun 2026 | In Progress |
| Qualify a third backup citric acid source closer to Cikarang (target: West Java-based supplier) | Category Manager – Chemicals | 30 Sep 2026 | In Progress |
| Establish pre-agreed expedited freight protocol with logistics partners for future force majeure events | Logistics Department | 31 May 2026 | Completed |

## Rules

1. Any production stoppage exceeding 4 hours attributable to a supply chain cause must be logged as a Supply Chain Incident within 24 hours.
2. Incidents resulting in quantified financial impact above Rp 1,000,000,000 require root-cause analysis using a structured methodology (5-Why or Fishbone) and presentation to the Supply Chain Director within 10 working days.
3. Force majeure claims by suppliers must be substantiated with documentary evidence (e.g., local government flood notices, news reports) before penalty waivers are granted.
4. All corrective actions arising from an incident must have a named owner and due date, tracked to closure by Supply Chain Risk & Continuity Management.

## Procedures

1. Incident identified and logged in the Supply Chain Incident Register by the affected plant.
2. Immediate response team activated (Procurement, Plant Operations, Logistics).
3. Mitigation actions executed (alternate sourcing, expedited freight).
4. Post-incident root-cause analysis conducted within 10 working days.
5. Corrective Action Plan documented and tracked to closure.
6. Lessons learned incorporated into relevant policy updates (in this case, PRC-IRP-012 and PRC-SRA-007).

## Thresholds

| Impact Level | Financial Threshold | Reporting Requirement |
|---|---|---|
| Minor | Below Rp 250,000,000 | Logged in register only |
| Moderate | Rp 250,000,000 – Rp 1,000,000,000 | Summary to Category Manager + Supply Chain Director |
| Major | Above Rp 1,000,000,000 | Full root-cause analysis, Supply Chain Director and CFO notification |
| Critical | Above Rp 10,000,000,000 or multi-plant impact | Board Risk Committee notification |

## Penalties

This incident did not result in disciplinary action, as root cause was determined to be a systemic risk-methodology gap rather than individual negligence; the emergency response was assessed as timely and effective. Future incidents demonstrating failure to follow the Emergency Procurement protocol (PRC-SOP-001 Section 7) would be subject to standard disciplinary review.

## Approval Levels

Given the financial impact exceeds Rp 10,000,000,000 (Critical threshold), this report was escalated for Board Risk Committee notification, with the CFO and Supply Chain Director jointly presenting findings and the corrective action plan.

## Business Scenarios

**Scenario A**: A similar flooding event recurs in November 2026 after the safety stock increase to 8 days is implemented. With the extended buffer, the plant is able to absorb a 5-day delay without any production stoppage, validating the corrective action.

**Scenario B**: Had the flooding caused contamination of the citric acid shipment itself (rather than just delay), the incident would additionally trigger a Quality Assurance investigation and potential product recall risk assessment, requiring coordination with the Quality Assurance Department beyond the scope of this Supply Chain Incident Report alone.
