# AIHSR Risk Reference Tool - Key Definitions

This document defines terms and concepts used throughout the AI HSR Risk Reference Tool.

---

## General Safety & Reliability

### AI System Safety, Failure, and Limitations
AI systems that act in conflict with ethical standards or human goals or values, especially the goals of designers or users. These misaligned behaviors may be introduced by humans during design and development, such as through reward hacking and goal misgeneralization, and may result in AI using dangerous capabilities such as manipulation, deception, or situational awareness to seek power, self-proliferate, or achieve other goals.

### Data Drift
Changes in data distribution over time that affect model performance.

### Discrimination & Toxicity
Unequal treatment of individuals or groups by AI, often based on race, gender, or other sensitive characteristics, resulting in unfair outcomes and representation of those groups.

### Distributional Mitigation
Distributional mitigation is relevant when working with vulnerable populations, health disparities, or algorithms trained on biased datasets.

### Explainability
The ability to understand and communicate how an AI model makes decisions.

### Fairness
Fairness in AI refers to the various efforts to mitigate algorithmic bias in automated decision-making processes that rely on AI models.

### Harm Entity
The Entity responsible for the harm:
- **Human** - The risk is caused by a decision or action made by humans
- **AI** - The risk is caused by a decision or action made by an AI system
- **Other** - The risk is caused by some other reason or is ambiguous

### Human-Computer Interaction
Anthropomorphizing, trusting, or relying on AI systems by users, leading to emotional or material dependence and inappropriate relationships with or expectations of AI systems. Trust can be exploited by malicious actors or result in harm from inappropriate use of AI in critical situations.

### Intended Use / Intended Purpose
The intended indication, population, part of the body or type of tissue interacted with, user profile, use environment, and operating principle. The intended use drives the risk. Risk analysis involves reasonably foreseeable misuse, hazards, hazardous situations, and risk estimation.

### Intentional Harm
The risk occurs due to an expected outcome from pursuing a goal.

### Interactional Mitigation
Interactional mitigation strategies are crucial for studies involving AI interfaces, chatbots, or any situation where participants interact directly with AI tools.

### ISO Risk Estimation (ISO 14971)
Potential Impact on Participants (after mitigation). ISO 14971 says some risks are acceptable if benefits outweigh the risks.

### Malicious Actors & Misuse
Using AI systems to conduct large-scale disinformation campaigns, malicious surveillance, or targeted manipulation, with the aim of manipulating political processes, public opinion, and behavior.

### Misinformation
AI systems that inadvertently generate or spread incorrect or deceptive information, which can lead to inaccurate beliefs in users and undermine their autonomy.

### Privacy and Security
AI systems that memorize and leak sensitive personal data or infer private information about individuals without their consent. Vulnerabilities that can be exploited in AI systems resulting in unauthorized access, data breaches, or system manipulation.

### Red Teaming
Red teaming is the practice of rigorously challenging plans, policies, systems, and assumptions with an adversarial approach.

### Residual Risk
An ISO concept. Residual Risk Consideration helps IRBs evaluate whether risks are appropriately acknowledged, even if not eliminated.

### Systemic Mitigation
Systemic mitigation strategies are useful when protocols could scale, influence clinical workflows, or shape policies or downstream care delivery.

### Unintentional Harm
The risk occurs due to an unexpected outcome from pursuing a goal.

---

## Governance & Oversight Controls

### Board Structure & Oversight
Independent oversight required for human subjects protections. Governance structures and leadership roles that establish executive accountability for AI safety and risk management.

**Examples:** Dedicated risk committees, safety teams, ethics boards, crisis simulation training, multi-party authorization protocols, deployment veto powers.

### Risk Management
Systematic methods that identify, evaluate, and manage AI risks for comprehensive risk governance across organizations.

**Examples:** Enterprise risk management frameworks, risk registers with capability thresholds, compliance programs, pre-deployment risk assessments, independent risk assessments.

### Conflict of Interest Protections
Governance mechanisms that manage financial interests and organizational structures to ensure leadership can prioritize safety over profit motives.

**Examples:** Background checks for key personnel, windfall profit redistribution plans, stake limitation policies, protections against shareholder pressure.

### Whistleblower Reporting & Protection
Policies and systems that enable confidential reporting of safety concerns or ethical violations.

**Examples:** Anonymous reporting channels, non-retaliation guarantees, limitations on non-disparagement agreements, external whistleblower handling services.

### Safety Decision Frameworks
Protocols and commitments that constrain decision-making about model development, deployment, and capability scaling.

**Examples:** If-then safety protocols, capability ceilings, deployment pause triggers, safety-capability resource ratios.

### Environmental Impact Management
Processes for measuring, reporting, and reducing the environmental footprint of AI systems.

**Examples:** Carbon footprint assessment, emission offset programs, energy efficiency optimization, resource consumption tracking.

### Societal Impact Assessment
Processes that assess AI systems' effects on society, including impacts on employment, power dynamics, political processes, and cultural values.

**Examples:** Fundamental rights impact assessments, expert consultations on risk domains, stakeholder engagement processes, governance gap analysis.

---

## Technical & Security Controls

### Model & Infrastructure Security
Technical and physical safeguards that secure AI models, weights, and infrastructure to prevent unauthorized access, theft, tampering, and espionage.

**Examples:** Model weight tracking systems, multi-factor authentication protocols, physical access controls, background security checks, compliance with information security standards.

### Model Alignment
Technical methods to ensure AI systems understand and adhere to human values and intentions.

**Examples:** Reinforcement learning from human feedback (RLHF), direct preference optimization (DPO), constitutional AI training, value alignment verification systems.

### Model Safety Engineering
Technical methods and safeguards that constrain model behaviors and protect against exploitation and vulnerabilities.

**Examples:** Safety analysis protocols, capability restriction mechanisms, hazardous knowledge unlearning techniques, input/output filtering systems, defense-in-depth implementations.

### Content Safety Controls
Technical systems and processes that detect, filter, and label AI-generated content.

**Examples:** Synthetic media watermarking, content filtering mechanisms, prohibited content detection, metadata tagging protocols, deepfake creation restrictions.

---

## Operational Process Controls

### Testing & Auditing
Systematic internal and external evaluations that assess AI systems, infrastructure, and compliance processes.

**Examples:** Third-party audits, red teaming, penetration testing, dangerous capability evaluations, bug bounty programs.

### Data Governance
Policies and procedures that govern responsible data acquisition, curation, and usage.

**Examples:** Harmful content filtering protocols, compliance checks for data collection standards, user data privacy controls, data curation processes.

### Access Management
Operational policies and verification systems that govern who can use AI systems and for what purposes.

**Examples:** KYC verification requirements, API-only access controls, fine-tuning restrictions, acceptable use policies, high-stakes application prohibitions.

### Staged Deployment
Implementation protocols that deploy AI systems in stages, requiring safety validation before expanding.

**Examples:** Limited API access programs, gradual user base expansion, capability threshold assessments, pre-deployment validation checkpoints.

### Post-Deployment Monitoring
Ongoing monitoring processes that track AI behavior, user interactions, and societal impacts.

**Examples:** User interaction tracking systems, capability evolution assessments, periodic impact reports, automated misuse detection, usage pattern analysis tools.

### Incident Response & Recovery
Protocols and technical systems that respond to security incidents, safety failures, or capability misuse.

**Examples:** Incident response plans, emergency shutdown/rollback procedures, model containment mechanisms, safety drills, critical infrastructure protection measures.

---

## Transparency & Accountability Controls

### System Documentation
Comprehensive documentation protocols that record technical specifications, intended uses, capabilities, and limitations.

**Examples:** Model cards, system architecture documentation, compute resource disclosures, safety test result reports, system prompts, model specifications.

### Risk Disclosure
Formal reporting protocols that communicate risk information, mitigation plans, and safety evaluations.

**Examples:** Publishing risk assessment summaries, pre-deployment notifications to government, reporting large training runs, disclosing mitigation strategies.

### Incident Reporting
Formal processes that document and share AI safety incidents, security breaches, and near-misses.

**Examples:** Cyber threat intelligence sharing networks, mandatory breach notification procedures, incident database contributions, standardized near-miss documentation protocols.

### Governance Disclosure
Formal disclosure mechanisms that communicate governance structures and decision frameworks.

**Examples:** Published safety and/or alignment strategies, governance documentation safety cases, model registration protocols, public commitment disclosures.

### Third-Party System Access
Mechanisms granting controlled system access to vetted external parties.

**Examples:** Research access programs, third-party capability assessments, government access provisions, legal safe harbors for public interest evaluations.

### User Rights & Recourse
Frameworks and procedures that enable users to identify AI interactions, report issues, request explanations, and seek remediation.

**Examples:** User reporting channels, appeal processes, explanation request systems, remediation protocols, content verification.

---

## Phase/Stage of Development

### Phase 1: Discovery & Algorithm Development
This phase is about identifying meaningful real-world associations using existing data, literature, or simulation. Teams are still refining the purpose or scope of the algorithm and often don't have a deployable product. The work focuses on feasibility, signal detection, and exploring potential applications.

**Characteristics:**
- Retrospective dataset curation
- Model exploration
- Unsupervised pattern detection
- No output impacting decision-making
- No output entered into live environments

**Risk Level:** Typically low risk (tool not formally tested or influencing decisions)

### Phase 2: Validation (Prospective or Synthetic Validation)
Researchers begin to test early versions of the model in controlled settings. The focus is on performance verification—assessing accuracy, reliability, and generalizability across different datasets.

**Characteristics:**
- More realistic data
- System integration
- Possible clinician or research subject interaction
- Output not used alone for decision-making
- Must be backed up by standard methods

**Risk Level:** Moderate risk

### Phase 3: Clinical Investigation or Deployment
The AI tool is deployed in a live setting where it may inform or influence decisions, operations, or user behavior. The study examines real-world performance, capturing impacts, safety signals, and unintended consequences.

**Characteristics:**
- AI influences real-world decisions
- Affects subject outcomes or data interpretation
- May involve regulatory considerations (FDA)
- Full IRB oversight required
- Comprehensive risk mitigation plans

**Risk Level:** Higher risk

---

## Risk Levels

| Level | Description |
|-------|-------------|
| **High Risk** | Physical/psychological harm, privacy breach |
| **Medium Risk** | Miscommunication, minor exclusion |
| **Low Risk** | Minimal or no impact |
