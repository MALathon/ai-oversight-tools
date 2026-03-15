# AI Oversight Tools

Interactive toolkit for IRB review of AI in Human Subjects Research. Based on the Three-Stage IRB Review Framework (Eto, Lifson & Vidal, Frontiers in Systems Biology 2026) and the AIHSR Risk Reference Tool (Eto).

## Tech Stack

- **Framework:** SvelteKit 5 with Svelte 5 runes (`$state`, `$derived`)
- **Build:** Vite 7, static adapter for GitHub Pages
- **Graph engine:** Graphology — single source of truth for all entity relationships
- **DOCX export:** docxtemplater
- **Tests:** Playwright
- **Language:** TypeScript
- **Deployment:** GitHub Pages via GitHub Actions (static build to `/build/`)

## The 4 Tools

| Tool | Route | Audience | Purpose |
|------|-------|----------|---------|
| Risk Matrix | `/risk-matrix` | IRB reviewers | 3x3 grid: Stage x Patient Impact → risk level & oversight |
| Reviewer Checklist | `/reviewer` | IRB reviewers | Structured review prompts filtered by stage & model type, mapped to CFR approval criteria |
| Protocol Builder | `/protocol-builder` | PIs / study teams | Answer assessment questions → identifies risks → recommends mitigations & controls → export .docx |
| Admin / Traceability Editor | `/admin` | Developers / admins | Graph editor for risk-mitigation-control-regulation linkages |

All 4 tools are views into one knowledge graph.

## Three-Stage Framework

- **Stage 1: Discovery & Ideation** — teaching/training the system, retrospective data only
- **Stage 2: Analytic & Performance Validation** — evaluating system behavior, no real-world decisions
- **Stage 3: Real-World Deployment** — AI outputs influence real decisions, highest oversight

Note: Renamed from "Three-Phase" to "Three-Stage" per Frontiers publication.

## Graph Architecture

```
Questions ──trigger──→ Risk Subdomains ──mitigation──→ Mitigation Strategies ──contains──→ Technical Controls
                              │
                              └──regulation──→ CFR Regulations

Questions ──dependency (showIf)──→ Questions
```

**Entity types:** Questions, Risk Subdomains (24 in 7 domains), Mitigation Strategies, Technical Controls (600+ from MIT AI Risk Repository), CFR Regulations

**Edge types:** `trigger`, `mitigation`, `contains`, `regulation`, `dependency`

## Project Structure

```
ai-oversight-tools/
├── webapp/                    # SvelteKit 5 app (work here)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +layout.svelte    # Nav, feedback modal, footer
│   │   │   ├── +page.svelte      # Home page
│   │   │   ├── risk-matrix/      # Risk matrix tool
│   │   │   ├── reviewer/         # Reviewer checklist
│   │   │   ├── protocol-builder/ # Protocol builder
│   │   │   └── admin/            # Traceability editor
│   │   └── lib/admin/            # Shared types and components
│   └── static/data/              # 13 JSON data files (graph data)
├── docs/                          # Reference materials, plans
│   ├── reference/aihsr/           # AIHSR Risk Reference Tool source
│   └── superpowers/plans/         # Implementation plans
├── planning/                      # Build plan canvas
├── references/                    # MIT mitigations CSV
└── README.md
```

## Build & Dev Commands

```bash
cd webapp
npm install
npm run dev          # Dev server
npm run build        # Production build (static)
npm run check        # Type checking
npm run test         # Playwright tests
```

## Key Data Files (`webapp/static/data/`)

| File | Contents |
|------|----------|
| `stages.json` | 3 stages with descriptions |
| `risk-domains.json` | 7 risk domain categories |
| `risk-subdomains.json` | 24 risk subdomains with stageGuidance |
| `mitigation-strategies.json` | Strategies with stageAppropriateness |
| `technical-controls.json` | 600+ controls from MIT AI Risk Repository |
| `reviewer-prompts.json` | Review prompts keyed by subdomain |
| `assessment-questions.json` | Conditional questions for protocol builder |
| `traceability.json` | Graph edges linking all entities |
| `unified-schema.json` | Risk matrix config |
| `model-types.json` | 14 AI model types |
| `cfr-regulations.json` | CFR citations |
| `population-vulnerabilities.json` | 12 vulnerability types |
| `use-cases.json` | Example scenarios |

## Current State

**Working:**
- All 4 tools functional as SvelteKit 5 static site
- Graph-first architecture with Graphology
- GitHub Pages deployment via Actions
- DOCX export from Protocol Builder

**In progress (V3 overhaul):**
- Implementing Tamiko Eto's feedback on terminology (phase → stage)
- Reviewer voice updates (investigator-directed → IRB-directed)
- Missing content sections
- CFR reference updates

## Credits

- **AIHSR Risk Reference Tool:** Tamiko Eto, MA CIP (TechInHSR.com)
- **Three-Stage Framework:** Eto, Lifson, Vidal (Frontiers in Systems Biology, 2026)
- **MIT AI Risk Repository:** Source for risk taxonomy and technical controls
- **License:** CC BY-NC-SA 4.0
