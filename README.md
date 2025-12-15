# AI Oversight Tools

Interactive web tools for AI research oversight and IRB review, built with SvelteKit 5.

## Overview

This project provides web-based tools to help IRBs, researchers, and developers:
- Identify and assess AI-specific risks in human subjects research
- Navigate the 3-Phase IRB Review Framework
- Generate protocol requirements and mitigation strategies
- Trace connections between risks, mitigations, controls, and regulations

**All risk content is derived from the SME-reviewed AIHSR Risk Reference Tool v1.5 by Tamiko Eto, augmented with the MIT AI Risk Repository mitigation database.**

## Live Demo

**https://malathon.github.io/ai-oversight-tools/**

## Tools

| Route | Tool | Primary User | Purpose |
|-------|------|-------------|---------|
| `/risk-matrix` | Risk Matrix | IRB Reviewers | Visual 3×3 risk assessment grid (Phase × Patient Impact) |
| `/reviewer` | Reviewer Checklist | IRB Reviewers | Structured prompts for systematic protocol review |
| `/innovator` | Innovator Checklist | Researchers | Self-assessment to identify risks and get mitigation guidance |
| `/admin` | Traceability Editor | Developers | Graph-based editor for risk-mitigation-control linkages |

## Architecture

### Graph-First Design

The application uses [Graphology](https://graphology.github.io/) as the single source of truth for all entity relationships. The directed graph contains:

1. **Explicit Links** - From traceability data (trigger, mitigation, control, regulation relationships)
2. **Question Dependencies** - showIf conditions as dependency edges
3. **Control-Subcategory** - contains edges linking controls to their mitigation strategies

All derived data (link counts, connections, dependencies) are computed as cached graph queries using Svelte 5's `$derived.by()` reactive system.

```
┌────────────────────────────────────────────────────────────────────┐
│                      traceGraph (Graphology)                       │
│  ┌─────────┐    trigger    ┌──────┐   mitigation   ┌────────────┐ │
│  │Question │──────────────▶│ Risk │──────────────▶│ Subcategory │ │
│  └─────────┘               └──────┘               └────────────┘  │
│       │                        │                       │          │
│       │ dependency             │ regulation            │ contains │
│       ▼                        ▼                       ▼          │
│  ┌─────────┐              ┌──────────┐            ┌─────────┐     │
│  │Question │              │Regulation│            │ Control │     │
│  └─────────┘              └──────────┘            └─────────┘     │
└────────────────────────────────────────────────────────────────────┘
```

### Guidance Accumulation

The system collects phase-specific guidance during graph traversal:

- **Risks**: `phaseGuidance` - risk context per phase
- **Subcategories**: `phaseGuidance` + `phaseAppropriateness` - strategy guidance + importance level
- **Controls**: `implementationNotes` - implementation guidance per phase

This enables LLM synthesis by collecting all relevant guidance along traversal paths from any starting node.

## Project Structure

```
ai-oversight-tools/
├── webapp/                         # SvelteKit 5 application
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin/             # Traceability graph editor
│   │   │   ├── innovator/         # Innovator self-assessment
│   │   │   ├── reviewer/          # Reviewer checklist
│   │   │   └── risk-matrix/       # Risk assessment matrix
│   │   └── lib/
│   │       └── admin.ts           # Shared filters and utilities
│   └── static/data/               # JSON data files
│       ├── assessment-questions.json
│       ├── risk-domains.json
│       ├── risk-subdomains.json
│       ├── mitigation-strategies.json
│       ├── technical-controls.json  # 600+ controls from MIT AI Risk Repository
│       ├── traceability.json        # Entity linkages
│       └── unified-schema.json
│
├── packages/rules-data/            # Legacy data (deprecated)
│
└── docs/
    ├── reference/aihsr/            # AIHSR Risk Reference Tool source data
    └── planning/                   # Implementation plans
```

## Key Data Files

| File | Content |
|------|---------|
| `risk-subdomains.json` | 24 risk subdomains with CFR references and phase guidance |
| `risk-domains.json` | 7 risk domain categories |
| `mitigation-strategies.json` | Mitigation subcategories with phase guidance and appropriateness |
| `technical-controls.json` | 600+ controls from MIT AI Risk Repository with implementation notes |
| `traceability.json` | Graph edges linking entities |
| `assessment-questions.json` | Questions that trigger risk identification |
| `cfr-regulations.json` | CFR regulation citations |

## The 3-Phase IRB Framework

| Phase | Name | Risk Level | Key Focus |
|-------|------|------------|-----------|
| 1 | Discovery & Algorithm Development | Low | Data governance, privacy, bias identification |
| 2 | Validation | Moderate | Performance validation, fairness testing |
| 3 | Clinical Investigation/Deployment | Higher | Patient safety, human-in-the-loop, monitoring |

## Technology Stack

- **Framework**: SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **Graph Library**: Graphology for directed graph operations
- **Build**: Vite 7
- **Deployment**: GitHub Pages via GitHub Actions

## Development

```bash
cd webapp
npm install
npm run dev
```

Build and check:
```bash
npm run build
npm run check
```

## License

AIHSR Risk Reference Tool © 2025 by Tamiko Eto
Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

MIT AI Risk Repository data used under MIT license.

## Credits

- **AIHSR Risk Reference Tool**: Tamiko Eto, MA CIP (TechInHSR.com)
- **3-Phase AI HSR IRB Review Framework**: Eto, Vidal, Lifson (2024)
- **MIT AI Risk Repository**: Primary source for risk taxonomy and technical controls

## Contact

- **Email**: TechInHSR@gmail.com
- **Scheduling**: https://calendly.com/etohtamiko
- **Feedback**: https://forms.gle/2ij9ic3N8ePN1i799
