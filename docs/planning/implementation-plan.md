# AI Oversight Tools - SvelteKit Webapp Plan

## Overview
Convert presentation slides 18 (Risk Matrix) and 19 (Checklist Builder) into standalone SvelteKit webapps with a shared admin interface for rules management.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repository | **New separate repo** (`ai-oversight-tools`) | Clean separation from presentations, independent deployment |
| Framework | **SvelteKit** | File-based routing, SSR-capable, modern tooling |
| Data Storage | **JSON files in repo** | Version-controlled, simple, no backend needed |
| Admin Structure | **One shared admin app** | Both public apps consume same rules data |
| Auth | **Simple password (SHA-256 hash)** | Small team access, session-based |
| Deployment | **GitHub Pages** | Static adapter, `malathon.github.io/ai-oversight-tools/` |

---

## Repository Structure

```
ai-oversight-tools/                    # NEW REPO (github.com/MALathon/ai-oversight-tools)
├── apps/
│   ├── risk-matrix/                   # App 1: Risk Control Prioritization Matrix
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── +page.svelte       # Main matrix view
│   │   │   │   └── +layout.svelte     # Dark theme layout
│   │   │   └── lib/
│   │   │       ├── components/        # RiskMatrix, RiskCell, Q3Panel
│   │   │       ├── stores/            # UI state (flipped cells, selections)
│   │   │       └── utils/             # Q3 scoring calculations
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── checklist-builder/             # App 2: Practical Checklist Builder
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── +page.svelte       # Main 3-panel checklist view
│   │   │   │   └── +layout.svelte
│   │   │   └── lib/
│   │   │       ├── components/        # ContextPanel, CharacteristicsPanel, RequirementsPanel
│   │   │       ├── stores/            # User answers, computed characteristics
│   │   │       └── utils/             # Scoring, filtering, oversight calculation
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── admin/                         # Shared Admin Interface
│       ├── src/
│       │   ├── routes/
│       │   │   ├── +page.svelte               # Dashboard overview
│       │   │   ├── +layout.svelte             # Auth guard + nav
│       │   │   ├── characteristics/+page.svelte    # Tech characteristics CRUD
│       │   │   ├── matrix-cells/+page.svelte       # Risk matrix cell editor
│       │   │   ├── scoring/+page.svelte            # Phase-tech & Q2 impact matrices
│       │   │   ├── questions/+page.svelte          # Dynamic question bank
│       │   │   ├── synergies/+page.svelte          # Contextual synergies
│       │   │   ├── profiles/+page.svelte           # Institution profiles
│       │   │   ├── thresholds/+page.svelte         # Category thresholds
│       │   │   ├── oversight/+page.svelte          # Oversight calculation rules
│       │   │   └── import-export/+page.svelte      # Excel import/export
│       │   └── lib/
│       │       ├── components/admin/   # DataTable, ControlEditor, ExcelHandler
│       │       └── stores/             # Auth store
│       ├── svelte.config.js
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── rules-data/                    # Shared JSON rule files
│   │   ├── tech-categories.json       # 48 characteristics × 5 tech types × 3 control levels
│   │   ├── matrix-cells.json          # 9 risk matrix cells
│   │   ├── phase-tech-matrix.json     # Phase-technology scoring (0-15 pts)
│   │   ├── q2-impact-matrix.json      # Q2 answer impacts (-10 to +20 pts)
│   │   ├── contextual-synergies.json  # Condition-bonus pairs
│   │   ├── profile-settings.json      # Conservative/Standard/Streamlined
│   │   ├── category-thresholds.json   # Critical/Important/Suggested/Optional
│   │   ├── oversight-rules.json       # Oversight level calculation
│   │   ├── dynamic-questions.json     # Question banks by phase
│   │   └── protocol-requirements.json # Requirement category groups
│   │
│   ├── rules-engine/                  # Shared TypeScript calculation logic
│   │   ├── src/
│   │   │   ├── scoring.ts             # Q3 impact, characteristic scoring
│   │   │   ├── filtering.ts           # Characteristic filtering by profile
│   │   │   ├── oversight.ts           # Oversight level calculation
│   │   │   ├── requirements.ts        # Protocol requirement generation
│   │   │   └── types.ts               # TypeScript interfaces
│   │   └── package.json
│   │
│   └── ui-components/                 # Shared Svelte components
│       ├── src/
│       │   ├── InteractionHint.svelte
│       │   ├── ProfileToggle.svelte
│       │   ├── YesNoQuestion.svelte
│       │   ├── CharacteristicBadge.svelte
│       │   └── theme.css              # Dark theme CSS variables
│       └── package.json
│
├── package.json                       # Workspace root
├── pnpm-workspace.yaml
├── .github/workflows/deploy.yml       # GitHub Actions deployment
└── README.md
```

---

## JSON Schema Design

### 1. tech-categories.json (48 characteristics)
```json
{
  "$schema": "./schemas/tech-categories.schema.json",
  "version": "1.0.0",
  "lastModified": "2025-12-13T00:00:00Z",
  "categories": {
    "ml": {
      "name": "ML/Predictive Models",
      "description": "Machine learning and predictive modeling systems",
      "characteristics": [
        {
          "key": "autonomous",
          "name": "Autonomous operation",
          "desc": "Operates without human input",
          "score": 4,
          "controls": {
            "low": ["Clear operating boundaries", "Document decision logic"],
            "medium": ["Human approval for edge cases", "Regular audits", "Override capability"],
            "high": ["Kill switch required", "Real-time monitoring", "Human takeover protocol"]
          },
          "metadata": { "isoReference": "ISO 14971:2019 5.4", "lastUpdated": "2025-12-13" }
        }
      ]
    },
    "llm": { ... },
    "imaging": { ... },
    "wearables": { ... },
    "apps": { ... }
  }
}
```

### 2. matrix-cells.json (9 cells)
```json
{
  "version": "1.0.0",
  "axes": {
    "x": { "label": "Q1: Clinical Intent", "values": ["Exploratory", "Translational", "Clinical"] },
    "y": { "label": "Q2: Patient Impact", "values": ["No Impact", "Indirect", "Direct Care"] }
  },
  "cells": [
    {
      "id": "cell-2-1", "row": 2, "col": 1,
      "q1": "Exploratory", "q2": "No Impact",
      "risk": 1, "label": "Low", "oversight": "Minimal",
      "details": "Pure research, no patient involvement"
    }
  ]
}
```

### 3. phase-tech-matrix.json
```json
{
  "version": "1.0.0",
  "description": "Phase-technology interaction scoring (0-15 points)",
  "matrix": {
    "discovery": {
      "ml": { "training_data": 12, "black_box": 8, "patient_data": 10 },
      "llm": { "context_window": 10, "hallucination": 8, "external_api": 9 }
    },
    "translational": { ... },
    "clinical": { ... }
  }
}
```

### 4. q2-impact-matrix.json
```json
{
  "version": "1.0.0",
  "impacts": {
    "vulnerable": {
      "questionText": "Will this involve vulnerable populations?",
      "yes": { "vulnerable_populations": 25, "pediatric": 15, "equity": 12 },
      "no": { "standard_populations": 5, "adult_focused": 3 }
    },
    "autonomous": {
      "questionText": "Can the AI make decisions without human review?",
      "yes": { "autonomous": 25, "clinical_decisions": 12, "human_oversight": -8 },
      "no": { "human_oversight": 10, "supervised": 8 }
    }
  }
}
```

### 5. profile-settings.json
```json
{
  "version": "1.0.0",
  "profiles": {
    "conservative": {
      "label": "Conservative", "description": "More oversight, broader review",
      "multiplier": 1.3, "thresholdAdjustment": -5, "minCharacteristics": 10,
      "forceInclude": ["limited_demographics", "proprietary_algorithm"]
    },
    "standard": {
      "multiplier": 1.0, "thresholdAdjustment": 0, "minCharacteristics": 7
    },
    "streamlined": {
      "multiplier": 0.7, "thresholdAdjustment": 5, "minCharacteristics": 5, "maxCharacteristics": 10
    }
  }
}
```

### 6. oversight-rules.json
```json
{
  "version": "1.0.0",
  "phaseScores": { "discovery": 2, "translational": 5, "clinical": 8 },
  "q2Weights": { "vulnerable": 5, "autonomous": 4, "treatment": 4, "override": -1 },
  "levels": {
    "minimal": { "maxScore": 5, "description": "Expedited review" },
    "standard": { "maxScore": 12, "description": "Standard review process" },
    "enhanced": { "maxScore": 20, "description": "Additional safeguards" },
    "full": { "maxScore": null, "description": "Comprehensive review" }
  },
  "hardRules": [
    { "condition": "vulnerable === 'yes' || autonomous === 'yes'", "minLevel": "standard" }
  ]
}
```

---

## Admin UI Sections

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/admin` | Dashboard | Overview, last modified dates, quick stats |
| `/admin/characteristics` | Tech Characteristics | CRUD for 5 tech types × characteristics, 3-level controls editor |
| `/admin/matrix-cells` | Risk Matrix Cells | Edit 9 cells: risk level, label, oversight, details |
| `/admin/scoring` | Scoring Matrices | Phase-tech scores, Q2 impact matrices |
| `/admin/questions` | Question Bank | Dynamic Q2 questions by phase (core/extended) |
| `/admin/synergies` | Contextual Synergies | Condition-bonus pairs |
| `/admin/profiles` | Institution Profiles | Conservative/Standard/Streamlined settings |
| `/admin/thresholds` | Category Thresholds | Critical/Important/Suggested score thresholds |
| `/admin/oversight` | Oversight Rules | Phase scores, Q2 weights, hard rules |
| `/admin/import-export` | Bulk Data | Excel import/export for all data types |

---

## Authentication

**Approach:** Client-side SHA-256 password verification with sessionStorage.

```typescript
// packages/ui-components/src/stores/auth.ts
export async function authenticate(password: string): Promise<boolean> {
  const hash = await sha256(password);
  const config = await fetch('/data/admin-config.json').then(r => r.json());
  if (hash === config.passwordHash) {
    sessionStorage.setItem('admin_session', JSON.stringify({
      authenticated: true,
      expires: Date.now() + 3600000
    }));
    return true;
  }
  return false;
}
```

---

## Excel Import/Export Format

### Tech Characteristics Sheet
| Category | Key | Name | Description | Score | Low Controls | Medium Controls | High Controls |
|----------|-----|------|-------------|-------|--------------|-----------------|---------------|
| ml | autonomous | Autonomous operation | Operates without human | 4 | Control1; Control2 | Control3; Control4 | Control5; Control6 |

### Scoring Matrix Sheet
| Phase | Tech Type | Characteristic | Score |
|-------|-----------|----------------|-------|
| discovery | ml | training_data | 12 |

### Q2 Impact Sheet
| Question Key | Answer | Affected Characteristic | Impact Score |
|--------------|--------|------------------------|--------------|
| vulnerable | yes | vulnerable_populations | 25 |

---

## Deployment Configuration

### svelte.config.js (per app)
```javascript
import adapter from '@sveltejs/adapter-static';
const appName = 'risk-matrix'; // or 'checklist-builder' or 'admin'

export default {
  kit: {
    adapter: adapter({ pages: 'dist', fallback: 'index.html' }),
    paths: { base: `/ai-oversight-tools/${appName}` }
  }
};
```

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install && pnpm build
      - uses: JamesIves/github-pages-deploy-action@v4
        with: { folder: dist }
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create `ai-oversight-tools` repo with monorepo structure (pnpm workspaces)
- [ ] Extract all rules data from React code → JSON files
- [ ] Set up `rules-engine` package with TypeScript scoring logic
- [ ] Create shared `ui-components` with dark theme

### Phase 2: Risk Matrix App
- [ ] Port Slide18 components to Svelte (RiskMatrix, RiskCell, Q3Panel)
- [ ] Implement flip animations, keyboard shortcuts
- [ ] Connect to shared rules-data

### Phase 3: Checklist Builder App
- [ ] Port Slide19 3-panel layout to Svelte
- [ ] Implement dynamic question generation
- [ ] Connect scoring/filtering from rules-engine

### Phase 4: Shared Admin
- [ ] Auth system with password protection
- [ ] CRUD interfaces for all 10 rule types
- [ ] Excel import/export with xlsx library
- [ ] Validation and preview before save

### Phase 5: Polish & Deploy
- [ ] GitHub Pages deployment via Actions
- [ ] Add link from presentations landing page
- [ ] Documentation and README

---

## Source Files Reference

| Source (React) | Purpose | Target (Svelte) |
|----------------|---------|-----------------|
| `techCharacteristics.js` | 48 characteristics + controls | `rules-data/tech-categories.json` |
| `Slide18_RiskAcceptabilityMatrix.jsx` | Matrix cells, Q3 calculations | `apps/risk-matrix/` |
| `Slide19_PracticalChecklist.jsx` | All scoring matrices, filtering | `apps/checklist-builder/` + `rules-engine/` |

---

## AIHSR Risk Reference Tool - Data Structure (from Tamiko Eto's tool)

The user provided `AIHSR_Risk_Reference_Tool_Content.md` which contains a comprehensive IRB AI risk assessment framework with:

### Key Data Tables:
1. **Model Types** (14): Predictive, LLM, Generative, Classification, Recommendation, Supervised ML, Computer Vision, Unsupervised ML, Speech/Audio, RL, Semi-Supervised, Self-Supervised, Multi-Modal, Foundation
2. **Population Vulnerabilities** (12): Children, Employees, Older Adults, Cognitively Impaired, Racial/Ethnic minorities, Non-English-Speaking, Economically Disadvantaged, Educationally Disadvantaged, Students, All, N/A
3. **Risk Domains** (7): Discrimination & Toxicity, Privacy & Security, Misinformation, Malicious Actors & Misuse, Human-Computer Interaction, Socioeconomic & Environmental Harms, AI System Safety/Failure/Limitations
4. **Phases** (3): Phase 1 (Discovery), Phase 2 (Validation), Phase 3 (Clinical/Deployment)
5. **Risk Subdomains** (20+): Each with CFR regulation references
6. **Mitigation Strategies**: Phase-based mitigation examples
7. **Reviewer Prompts**: Structured IRB reviewer questions per risk type

### Relationship to Existing Slides:
- This tool is **more comprehensive** than the existing slides 18/19
- Need to determine: Build apps around THIS framework, or merge with existing framework?

---

## Immediate Next Steps

### Step 1: Create New Repo (NOW)
```bash
mkdir /home/mlifson/Development/ai-oversight-tools
cd /home/mlifson/Development/ai-oversight-tools
git init
```

### Step 2: Move Reference Files
- Copy `AIHSR_Risk_Reference_Tool_Content.md` → `docs/reference/`
- Copy this plan file → `docs/planning/`
- Copy existing slides for reference → `docs/reference/original-slides/`

### Step 3: Establish Structure
```
ai-oversight-tools/
├── docs/
│   ├── planning/           # This plan, design docs
│   └── reference/          # AIHSR tool, original slides
├── apps/                   # SvelteKit apps (empty for now)
├── packages/               # Shared packages (empty for now)
└── README.md
```

---

## Status: READY TO CREATE REPO
- [x] **Reference document received** (AIHSR_Risk_Reference_Tool_Content.md)
- [ ] Create new repo and folder structure
- [ ] Analyze AIHSR data structure in detail
- [ ] Decide on data model integration approach
