# AIHSR Risk Reference Tool - Model Information

Simplified Model Documentation following EU AI Act transparency form guidelines.

---

## General Information

| Field | Value |
|-------|-------|
| **Date Updated** | September 3, 2025 |
| **Document Version** | 1.5 |
| **Legal Name for Model Provider** | Tamiko Eto, Founder of TechInHSR |
| **Model Name** | AI in Human Subjects Research (AIHSR) Risk Reference Tool |
| **Model Authenticity** | Spreadsheet-based tool, distributed via file-sharing |
| **Release Date** | Anticipated pilot release: September 12, 2025 |
| **Union Market Release Date** | N/A (not yet released commercially) |
| **Model Dependencies** | N/A |

---

## Model Properties

| Property | Description |
|----------|-------------|
| **Model Architecture** | Structured decision-support tool (spreadsheet + coded logic, dropdown menus, risk scoring) |
| **Design Specifications** | A governance support tool designed to map AI-specific risks in human subjects research protocols, assign severity/likelihood, and generate reviewer prompts with mitigation guidance |
| **Basis** | MIT AI Risk Libraries, ISO standards, and U.S. federal regulations (45 CFR 46, 21 CFR 56) |
| **Framework** | Phased oversight (discovery, validation, clinical investigation) to scale requirements according to maturity and impact |
| **Input Modalities** | Text (protocol features entered via structured spreadsheet fields) |
| **Output Modalities** | Text (risk categories, reviewer prompts, mitigation recommendations) |
| **Total Model Size** | Small-scale decision-support logic (<500M parameters; spreadsheet-based, not a trained ML model) |

---

## Distribution & License

| Field | Value |
|-------|-------|
| **Distribution Channels** | Spreadsheet tool, shared with IRBs and administrators (internal pilots). Future plan: integration into IRB management systems or lightweight web app |
| **Copyright** | AI HSR Risk Reference Tool © 09/04/2025 by Tamiko Eto |
| **License** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

---

## Intended Use

### Acceptable Use Policy
Intended only for:
- IRB reviewers
- Research administrators
- Governance committees evaluating AI-driven health research

### Intended Uses
1. Standardize AI risk review in human subjects research
2. Reduce reviewer burden and variability in oversight
3. Enhance transparency and communication of residual risks

### Integration Type
Decision-support / governance systems; **not intended for clinical decision-making or autonomous systems**

---

## Technical Integration

| Field | Description |
|-------|-------------|
| **Technical Means for Integration** | Currently spreadsheet; adaptable for web-based workflow tools (e.g., REDCap, Airtable, or IRB system integration). Future plans for API and webapp |
| **Required Hardware/Software** | Basic spreadsheet software (Excel, Google Sheets); future: browser interface |

---

## Training Process

**Not applicable** — No ML training. Tool is rule-based using expert input and regulatory standards.

---

## Data Used

| Field | Value |
|-------|-------|
| **Data Type/Modality** | N/A (does not use training datasets) |
| **Data Provenance** | Expert curation (regulations, standards, and risk libraries) |
| **Scope and Characteristics** | Focused on AI research risks: transparency, privacy, bias, misclassification, equity, human-computer interaction |
| **Curation Methods** | Literature review + mapping of AI risks to IRB-relevant domains |

---

## Computational Resources

| Resource | Value |
|----------|-------|
| **Training Time** | N/A (no ML training) |
| **Energy Consumption** | Negligible (spreadsheet execution) |
