# AI Oversight Tools

Interactive web tools for AI research oversight and IRB review, built with SvelteKit.

## Overview

This project provides web-based tools to help IRBs, researchers, and developers:
- Identify and assess AI-specific risks in human subjects research
- Navigate the 3-Phase IRB Review Framework
- Generate protocol requirements and mitigation strategies

**All risk content is derived from the SME-reviewed AIHSR Risk Reference Tool v1.5 by Tamiko Eto.**

## Three Tools, One Data Model

| Tool | Primary User | Purpose |
|------|-------------|---------|
| **Risk Matrix** | IRB Reviewers | Visual 3×3 risk assessment grid (Phase × Patient Impact) |
| **Reviewer Checklist** | IRB Reviewers | Structured prompts for systematic protocol review |
| **Innovator Checklist** | Researchers | Self-assessment to identify risks and get mitigation guidance |

All three tools share the same AIHSR data, presented through different lenses:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AIHSR Core Data (SME-reviewed)               │
│  • 24 Risk Subdomains with CFR references                       │
│  • Phase-specific reviewer prompts                              │
│  • Phase-specific mitigation language                           │
│  • 14 AI model types                                            │
│  • 12 population vulnerability categories                       │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ Risk Matrix │   │  Reviewer   │   │  Innovator  │
    │    Tool     │   │  Checklist  │   │  Checklist  │
    └─────────────┘   └─────────────┘   └─────────────┘
```

## Project Structure

```
ai-oversight-tools/
├── apps/                       # SvelteKit applications (planned)
│   ├── risk-matrix/            # Risk Matrix Tool
│   ├── reviewer-checklist/     # Reviewer Checklist Tool
│   └── innovator-checklist/    # Innovator Checklist Tool
│
├── packages/
│   └── rules-data/             # Unified data model
│       ├── unified-schema.json     # Orchestration config
│       ├── assessment-questions.json # Questions for Innovator tool
│       └── README.md               # Data architecture docs
│
└── docs/
    ├── reference/
    │   └── aihsr/              # AIHSR Risk Reference Tool data
    │       ├── data/           # Core JSON data files
    │       ├── rules/          # Business logic (CFR refs, mitigations)
    │       ├── documentation/  # Human-readable guides
    │       └── examples/       # Sample use cases
    └── planning/               # Implementation plans
```

## Key Data Files

### AIHSR Core Data (`docs/reference/aihsr/`)
| File | Content |
|------|---------|
| `data/risk-subdomains.json` | 24 risk subdomains with CFR references |
| `data/risk-domains.json` | 7 risk domain categories |
| `data/model-types.json` | 14 AI model type definitions |
| `data/reviewer-prompts.json` | IRB reviewer prompts by subdomain/phase |
| `rules/phase-mitigations.json` | Mitigation templates by subdomain/phase |
| `examples/use-cases.json` | 13 sample AI use cases with assessments |

### Unified Schema (`packages/rules-data/`)
| File | Purpose |
|------|---------|
| `unified-schema.json` | Risk matrix config, oversight levels, mappings |
| `assessment-questions.json` | Questions that trigger risk subdomains |

## The 3-Phase IRB Framework

| Phase | Name | Risk Level | Key Focus |
|-------|------|------------|-----------|
| 1 | Discovery & Algorithm Development | Low | Data governance, privacy, bias identification |
| 2 | Validation | Moderate | Performance validation, fairness testing |
| 3 | Clinical Investigation/Deployment | Higher | Patient safety, human-in-the-loop, monitoring |

## Technology Stack

- **Framework**: SvelteKit
- **Build**: Vite
- **Package Manager**: pnpm (workspaces)
- **Deployment**: GitHub Pages (`malathon.github.io/ai-oversight-tools/`)

## License

AIHSR Risk Reference Tool © 2025 by Tamiko Eto
Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

## Credits

- **AIHSR Risk Reference Tool**: Tamiko Eto, MA CIP (TechInHSR.com)
- **3-Phase AI HSR IRB Review Framework**: Eto, Vidal, Lifson (2024)
- **MIT AI Risk Repository**: Primary source for risk taxonomy

## Contact

- **Email**: TechInHSR@gmail.com
- **Scheduling**: https://calendly.com/etohtamiko
- **Feedback**: https://forms.gle/2ij9ic3N8ePN1i799
