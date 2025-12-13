# AIHSR Risk Reference Tool - About Project

## Project Information

- **Submission Date:** September 21, 2025
- **Owner:** Tamiko Eto, MA CIP
- **Funding:** None
- **Title:** Quick Reference Risk Identification and Mitigation Guide for IRBs Reviewing AI in Human Subjects Research (AIHSR)

## Overview

This project produces a spreadsheet-based reference tool to assist Institutional Review Boards (IRBs) in identifying and addressing AI-specific risks during their review of AI in human subjects research (AIHSR), to ensure an effective review under 45 CFR 46 and 21 CFR 56.

Currently, there is a lack of AI safety subject matter experts (SMEs) within IRBs that can conduct a meaningful and effective review of AI HSR (understanding the project, the foreseeable risks, recommend mitigation risks within the confines of the relevant regulations). As a result, many IRBs may:
- Fail to identify important risks
- Process protocols without addressing relevant regulatory frameworks
- Cause delays in the timeline to approval

This tool is intended to streamline the review process, reduce cognitive burden for non-SME reviewers while helping ensure appropriate protections are incorporated into protocols involving AI/ML technologies.

## Scope

### Included
- AI-specific risks presented in research protocols subject to IRB oversight under U.S. human subjects regulations
- Front-end protocol review of studies using AI (particularly for more complex AI systems such as predictive modeling, generative AI, LLMs, etc.)
- Use by trained AI-reviewers, supporting a more balanced parallel reviewer process (regulatory + AI)

### Excluded
- Backend model validation
- Regulatory compliance (device-specific)
- IRB operational processes
- AI tools used outside a research context (e.g., clinical care applications)

## Methodology

Thematic analysis is based on:

1. **MIT's AI Risk Library** - Comprehensive taxonomy of AI risks
2. **MIT's AI Risk Mitigation Library** - Strategies for mitigating identified risks
3. **ISO 14971** - Medical device risk management standards (applicable to AI medical devices)
4. **3-Phase AI HSR IRB Review Framework** (Eto, Vidal, Lifson 2024)

Risks are mapped to key research design features:
- Model type
- Participant vulnerability
- Data sensitivity

**Note:** The risks collected from the MIT AI Risk Library are AI-specific risks most relevant to human subjects research, especially those involving direct or indirect interaction with participants.

## Four Most Common Risks in AI HSR

1. **Misclassification** - Incorrect model outputs affecting decisions
2. **Transparency** - Lack of explainability in AI decision-making
3. **Participant Vulnerability & Equity** - Unequal treatment or outcomes
4. **Data Sensitivity and Privacy** - Protection of personal information

## Focus Areas (Risk Domains)

The guide centers on four risk domains:

| Domain | Description |
|--------|-------------|
| Discrimination & Toxicity | Bias, fairness, and harmful output |
| Privacy & Security | Data and system security/confidentiality |
| Misinformation | False output or hallucinations |
| Human-Computer Interaction | Ensuring humans drive decision-making |

## Deliverable

A conceptual prototype of a static reference guide to support IRBs in identifying and mitigating common AI-related risks in human subjects research. The tool is intended as a reviewer aid. Future iterations may include automation.

## Limitations

### Standards Not Yet Incorporated
- ISO 42001 (AI management systems)
- ISO 23894 (AI risk management)
- ISO 42005 (AI system impact assessments)
- ISO 24368 (ethical and societal concerns)

### Geographic Scope
- Currently only U.S. regulations are incorporated
- Global standards will be incorporated in future versions
- This was done intentionally as IRB oversight is largely a U.S. framework

## Timeline

The project was completed in four weeks, with a narrowly-defined scope and a basic spreadsheet-based output tested informally for usability and clarity.

## Copyright

AI HSR Risk Reference Tool © 09/04/2025 by Tamiko Eto is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
