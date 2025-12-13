# AIHSR Risk Reference Tool - Structured Data

This directory contains structured data extracted from the AIHSR Risk Reference Tool v1.5 by Tamiko Eto.

## Overview

The AI in Human Subjects Research (AIHSR) Risk Reference Tool is a decision-support tool that helps IRB reviewers, researchers, and developers identify potential risks of AI models, find recommended mitigation strategies, and guide ethical review using the 3-Phase IRB Review Framework.

## Directory Structure

```
aihsr/
├── data/                          # Core reference data (app-consumable JSON)
│   ├── model-types.json           # 14 AI model type definitions
│   ├── population-vulnerabilities.json  # 12 vulnerability categories
│   ├── risk-domains.json          # 7 risk domain categories
│   ├── risk-subdomains.json       # 22+ risk subdomains with CFR refs
│   ├── phases.json                # 3 development phases
│   ├── mitigation-strategies.json # Categorized mitigation approaches
│   └── reviewer-prompts.json      # IRB reviewer prompts by risk type
│
├── rules/                         # Business logic and mappings
│   ├── cfr-regulations.json       # CFR regulation catalog
│   └── phase-mitigations.json     # Phase-based mitigation templates
│
├── documentation/                 # Human-readable guides
│   ├── 01-instructions.md         # Quick start guide
│   ├── 02-about-project.md        # Project background and scope
│   ├── 03-definitions.md          # Key terms and definitions
│   ├── 04-sources.md              # References and citations
│   ├── 05-model-info.md           # Tool model documentation
│   └── 06-version-history.md      # Change log
│
├── examples/                      # Use case examples
│   └── use-cases.json             # 13 sample AI use cases with assessments
│
└── schemas/                       # JSON Schema definitions (future)
    └── (schema files for validation)
```

## Key Concepts

### 3-Phase IRB Review Framework

| Phase | Name | Risk Level | Description |
|-------|------|------------|-------------|
| 1 | Discovery & Algorithm Development | Low | Retrospective data, no clinical impact |
| 2 | Validation | Moderate | Prospective testing, controlled settings |
| 3 | Clinical Investigation/Deployment | Higher | Live deployment, influences decisions |

### Risk Domains

1. **Discrimination & Toxicity** - Bias, fairness, harmful output
2. **Privacy & Security** - Data protection, system security
3. **Misinformation** - False or misleading AI output
4. **Malicious Actors & Misuse** - Deliberate harm
5. **Human-Computer Interaction** - Overreliance, autonomy
6. **Socioeconomic & Environmental Harms** - Broader impacts
7. **AI System Safety, Failure, and Limitations** - Technical risks

### Risk Types

- **Distributional [D]** - Affects benefit/harm distribution across groups
- **Interactional [I]** - Arises from human-AI interaction
- **Systemic [S]** - Affects broader systems and structures

## Usage

These files are designed to be consumed by the AI Oversight Tools web applications:

1. **Risk Matrix App** - Uses risk domains, subdomains, and phases for risk assessment
2. **Checklist Builder App** - Uses prompts, mitigations, and examples for review guidance
3. **Admin Interface** - Manages all data through a unified editor

## License

AIHSR Risk Reference Tool © 2025 by Tamiko Eto
Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

## Contact

- **Email:** TechInHSR@gmail.com
- **Scheduling:** https://calendly.com/etohtamiko
- **Feedback:** https://forms.gle/2ij9ic3N8ePN1i799
