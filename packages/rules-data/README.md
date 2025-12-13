# Rules Data - Unified Data Model

This directory contains the unified data model for all three AI Oversight Tools. **All content is derived from the SME-reviewed AIHSR Risk Reference Tool v1.5 by Tamiko Eto.**

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AIHSR Core Data (SME-reviewed)               │
│  docs/reference/aihsr/                                          │
│  ├── data/risk-subdomains.json    ← 24 risk subdomains          │
│  ├── data/reviewer-prompts.json   ← IRB reviewer prompts        │
│  ├── rules/phase-mitigations.json ← Phase-specific mitigations  │
│  └── ...                                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Unified Schema Layer                          │
│  packages/rules-data/                                           │
│  ├── unified-schema.json     ← Orchestration config             │
│  └── assessment-questions.json ← Questions that trigger risks   │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ Risk Matrix │   │  Reviewer   │   │  Innovator  │
    │    Tool     │   │  Checklist  │   │  Checklist  │
    └─────────────┘   └─────────────┘   └─────────────┘
```

## How the Three Tools Use the Same Data

### 1. Risk Matrix Tool
**Purpose:** Visual 3×3 grid for quick risk assessment

**Data Flow:**
1. User selects Phase (Discovery/Validation/Clinical)
2. User selects Patient Impact (No Impact/Indirect/Direct Care)
3. System shows cell color (risk level) and oversight recommendation
4. Click cell → shows applicable risk subdomains and prompts for that cell

**Uses:**
- `unified-schema.json` → `riskMatrix.cells` for grid configuration
- `risk-subdomains.json` → subdomain details for cell expansion
- `reviewer-prompts.json` → prompts by phase for the expanded view

### 2. Reviewer Checklist Tool
**Purpose:** Systematic IRB review with structured prompts

**Data Flow:**
1. Reviewer selects Phase and Model Type(s)
2. System identifies applicable risk subdomains
3. Shows reviewer prompts for each subdomain (filtered by phase)
4. Reviewer checks each item, adds notes
5. Export assessment with CFR references

**Uses:**
- `model-types.json` → model type selection
- `unified-schema.json` → `modelTypeToSubdomainRelevance` mapping
- `reviewer-prompts.json` → prompts for each subdomain
- `risk-subdomains.json` → CFR references
- `mitigation-strategies.json` → expected mitigation approaches

### 3. Innovator Checklist Tool
**Purpose:** Self-assessment for researchers to identify risks and get mitigation guidance

**Data Flow:**
1. Innovator answers assessment questions (phase, model type, data handling, etc.)
2. System identifies triggered risk subdomains based on answers
3. Shows relevant mitigations from `phase-mitigations.json`
4. Calculates oversight level recommendation
5. Export protocol-ready mitigation language

**Uses:**
- `assessment-questions.json` → questions with subdomain triggers
- `phase-mitigations.json` → mitigation language per subdomain per phase
- `unified-schema.json` → oversight level calculation
- `unified-schema.json` → `vulnerabilityMultipliers` for population adjustments

## File Descriptions

### unified-schema.json
The orchestration layer that ties everything together:
- Risk matrix configuration (axes, cells, colors)
- Oversight level definitions
- Model type → subdomain mappings
- Vulnerability multipliers for populations
- References to all AIHSR data files

### assessment-questions.json
Questions for the Innovator Checklist that bridge user input to AIHSR risks:
- Each question has `triggers` that map answers to risk subdomains
- Questions are categorized (Project Basics, AI Technology, Data Handling, etc.)
- Supports single-select, multi-select, and yes/no question types

## Key Design Principles

1. **Single Source of Truth:** All risk content comes from AIHSR (SME-reviewed)
2. **Three Views, One Model:** Each tool presents the same data differently
3. **Phase-Aware:** Everything is organized by the 3-phase IRB framework
4. **Regulatory Grounded:** CFR references link to 45 CFR 46, 21 CFR 56, etc.
5. **Actionable Output:** Mitigations are protocol-ready language

## Data NOT Used

The original presentation slides contained `techCharacteristics.js` with 48 made-up technology characteristics. **This content is NOT used** in the unified model. Instead:

- **Assessment questions** capture the same concept (technical features → risk triggers)
- **AIHSR subdomains** provide the actual risk content
- **Phase mitigations** provide actionable mitigation language

## Adding New Content

To extend this framework:

1. **New Risk Subdomain:** Add to `docs/reference/aihsr/data/risk-subdomains.json`, then add prompts to `reviewer-prompts.json` and mitigations to `phase-mitigations.json`

2. **New Assessment Question:** Add to `assessment-questions.json` with appropriate subdomain triggers

3. **New Model Type:** Add to `model-types.json` and define subdomain relevance in `unified-schema.json` → `modelTypeToSubdomainRelevance`

## License

AIHSR Risk Reference Tool © 2025 by Tamiko Eto
Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
