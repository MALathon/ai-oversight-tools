# AI Oversight Tools

Interactive web tools for AI research oversight and IRB review, built with SvelteKit.

## Overview

This project provides web-based tools to help IRBs, researchers, and developers:
- Identify and assess AI-specific risks in human subjects research
- Navigate the 3-Phase IRB Review Framework
- Generate protocol requirements and mitigation strategies
- Manage rules and configurations through an admin interface

## Apps

| App | Description | Status |
|-----|-------------|--------|
| **Risk Matrix** | ISO 14971-based risk prioritization matrix | Planned |
| **Checklist Builder** | Dynamic protocol checklist generator | Planned |
| **Admin** | Shared rules management interface | Planned |

## Project Structure

```
ai-oversight-tools/
├── apps/                   # SvelteKit applications
│   ├── risk-matrix/        # Risk Control Prioritization Matrix
│   ├── checklist-builder/  # Practical Checklist Builder
│   └── admin/              # Shared Admin Interface
├── packages/               # Shared packages
│   ├── rules-data/         # JSON rule files
│   ├── rules-engine/       # Calculation logic
│   └── ui-components/      # Shared Svelte components
└── docs/                   # Documentation
    ├── planning/           # Design and implementation plans
    └── reference/          # Reference materials
```

## Reference Materials

- `docs/reference/AIHSR_Risk_Reference_Tool_Content.md` - AIHSR Risk Reference Tool (Tamiko Eto)
- `docs/reference/original-slides/` - Original React presentation slides
- `docs/planning/implementation-plan.md` - Detailed implementation plan

## Technology Stack

- **Framework**: SvelteKit
- **Build**: Vite
- **Package Manager**: pnpm (workspaces)
- **Deployment**: GitHub Pages

## License

TBD

## Credits

- AIHSR Risk Reference Tool by Tamiko Eto, MA CIP (TechInHSR.com)
- 3-Phase AI HSR IRB Review Framework (Eto, Vidal, Lifson 2024)
