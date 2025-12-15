# AI Oversight Tools - Web Application

A risk assessment and protocol generation tool for AI in Human Subjects Research, based on the AIHSR Risk Reference Tool.

## Data Architecture

### Entity Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INPUTS                                    │
│  • Selected Phase (phase-1, phase-2, phase-3)                           │
│  • Selected Model Types (llm, predictive, computer-vision, etc.)        │
│  • Question Answers                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  QUESTIONS (15)                                                          │
│  File: assessment-questions.json                                         │
│  • showIf conditions (conditional visibility based on prior answers)    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          trigger links
                    ┌───────────────┴───────────────┐
                    │  FILTER: link.phases          │
                    │  FILTER: link.answerValues    │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  RISKS (24)                                                              │
│  File: risk-subdomains.json                                              │
│  • Also triggered by: modelTypeRelevance[userModelType]                 │
│  • Also triggered by: vulnerabilityMultipliers[userVulnerability]       │
│  • OUTPUT: phaseGuidance[selectedPhase] ← protocol text for IRB         │
└─────────────────────────────────────────────────────────────────────────┘
            │                                       │
     mitigation links                        regulation links
            ▼                                       ▼
┌───────────────────────┐               ┌─────────────────────┐
│  SUBCATEGORIES (23)   │               │  REGULATIONS (45)   │
│  File: mitigation-    │               │  File: cfr-         │
│    strategies.json    │               │    regulations.json │
│  (mitigation groups)  │               │  (CFR references)   │
└───────────────────────┘               └─────────────────────┘
            │
            │ controls inherit via subcategoryId
            │ (no explicit links needed)
            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CONTROLS (815)                                                          │
│  File: technical-controls.json                                           │
│  Source: MIT AI Risk Repository                                          │
│  FILTER: control.phases.includes(selectedPhase)                         │
│  FILTER: control.techTypes.includes(modelType) OR techTypes = ["all"]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Link Types (in traceability.json)

| Type | From | To | Purpose |
|------|------|-----|---------|
| `trigger` | Question | Risk | Assessment answers activate risks |
| `mitigation` | Risk | Subcategory | Which mitigation strategies apply to each risk |
| `regulation` | Risk | Regulation | CFR references for each risk |
| `control` | Risk | Control | Direct risk-to-control mappings (optional, for curated links) |

### Filtering Logic

| Filter | Where Applied | Semantic |
|--------|---------------|----------|
| **Phase** | Trigger links, Control.phases, Risk.phaseGuidance | Empty = all phases |
| **Tech Type** | Control.techTypes, modelTypeRelevance | Empty or "all" = all types |
| **Answer Values** | Trigger links | Which answers activate the trigger |
| **Vulnerabilities** | vulnerabilityMultipliers | Special populations trigger additional risks |

### Data Files

| File | Description |
|------|-------------|
| `assessment-questions.json` | Assessment questions with conditional visibility |
| `risk-subdomains.json` | 24 risk areas with phaseGuidance protocol text |
| `mitigation-strategies.json` | 23 control subcategories grouped into 4 categories |
| `technical-controls.json` | 815 controls from MIT AI Risk Repository |
| `cfr-regulations.json` | CFR regulation references |
| `traceability.json` | All entity links (trigger, mitigation, regulation, control) |
| `unified-schema.json` | Model type relevance and vulnerability multipliers |
| `phases.json` | Phase definitions (Discovery, Validation, Deployment) |

## User Flow (Innovator)

1. User answers assessment questions
2. System determines triggered risks based on:
   - Trigger links (question answers)
   - Model type relevance
   - Vulnerability multipliers
3. For each triggered risk:
   - Show phase-specific guidance (protocol text for IRB)
   - Show applicable regulations (CFR references)
   - Show applicable controls (filtered by phase and tech type)
4. User can accept/customize mitigation text for protocol generation

## Admin Interface

The admin interface provides three views for managing the data:

- **Matrix View**: Spreadsheet-style entity editing
- **Trace View**: Hierarchical traceability exploration
- **Graph View**: Visual node-link diagram with 5 entity columns

## Development

```sh
npm install
npm run dev
```

## Building

```sh
npm run build
```

## Deployment

Deployed to GitHub Pages via GitHub Actions on push to main.
