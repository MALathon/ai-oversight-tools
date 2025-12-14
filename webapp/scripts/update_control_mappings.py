#!/usr/bin/env python3
"""
Update control mappings with reasoned phase and tech type assignments.
Based on AIHSR phase guidance and risk-control analysis.
"""

import json
from pathlib import Path
from datetime import date

# Paths
DATA_DIR = Path(__file__).parent.parent / "static" / "data"
CONTROLS_FILE = DATA_DIR / "technical-controls.json"
TRACEABILITY_FILE = DATA_DIR / "traceability.json"

# ============================================================================
# PHASE MAPPINGS BY SUBCATEGORY
# Based on AIHSR 3-Phase Framework analysis
# ============================================================================

SUBCATEGORY_PHASES = {
    # Governance & Oversight (1.x) - mostly all phases
    "board-oversight-1.1": ["phase-1", "phase-2", "phase-3"],  # Governance throughout
    "risk-management-1.2": ["phase-1", "phase-2", "phase-3"],  # Risk assessment all phases
    "conflict-interest-1.3": ["phase-1", "phase-2", "phase-3"],  # Ethics all phases
    "whistleblower-1.4": ["phase-2", "phase-3"],  # More relevant when deployed
    "safety-frameworks-1.5": ["phase-1", "phase-2"],  # Define early
    "environmental-1.6": ["phase-1"],  # Architecture decisions early
    "societal-impact-1.7": ["phase-1", "phase-2"],  # Assess before deployment

    # Technical & Security (2.x)
    "infrastructure-security-2.1": ["phase-2", "phase-3"],  # Security when live
    "model-alignment-2.2": ["phase-1", "phase-2"],  # Alignment during development
    "safety-engineering-2.3": ["phase-1", "phase-2"],  # Build safety in
    "content-safety-2.4": ["phase-1", "phase-2", "phase-3"],  # Content filtering all phases

    # Operational Process (3.x)
    "testing-auditing-3.1": ["phase-1", "phase-2", "phase-3"],  # Testing throughout
    "data-governance-3.2": ["phase-1", "phase-2", "phase-3"],  # Data management always
    "access-management-3.3": ["phase-2", "phase-3"],  # Access controls when deployed
    "staged-deployment-3.4": ["phase-3"],  # Only deployment phase
    "post-deployment-3.5": ["phase-3"],  # Only after deployment
    "incident-response-3.6": ["phase-3"],  # Only when deployed

    # Transparency & Accountability (4.x)
    "documentation-4.1": ["phase-1", "phase-2", "phase-3"],  # Document throughout
    "risk-disclosure-4.2": ["phase-2", "phase-3"],  # Disclose when validated
    "incident-reporting-4.3": ["phase-3"],  # Only when deployed
    "governance-disclosure-4.4": ["phase-2", "phase-3"],  # Disclose governance
    "third-party-access-4.5": ["phase-2", "phase-3"],  # Access for audits
    "user-rights-4.6": ["phase-3"],  # User rights in deployment
}

# ============================================================================
# TECH TYPE MAPPINGS BY SUBCATEGORY
# Based on model type risk profiles
# ============================================================================

SUBCATEGORY_TECH_TYPES = {
    # Content-focused subcategories - generative models
    "content-safety-2.4": ["llm", "generative-non-llm", "multi-modal", "foundation"],
    "model-alignment-2.2": ["llm", "reinforcement-learning", "foundation"],

    # Fairness-focused - decision/prediction models
    "societal-impact-1.7": ["predictive", "classification", "recommendation", "computer-vision", "supervised-ml"],

    # Security-focused - all but especially deployed systems
    "infrastructure-security-2.1": ["all"],
    "access-management-3.3": ["llm", "foundation", "multi-modal"],  # Powerful models need access control

    # Universal (apply to all tech types)
    "board-oversight-1.1": ["all"],
    "risk-management-1.2": ["all"],
    "conflict-interest-1.3": ["all"],
    "whistleblower-1.4": ["all"],
    "safety-frameworks-1.5": ["all"],
    "environmental-1.6": ["llm", "foundation", "multi-modal"],  # High compute models
    "safety-engineering-2.3": ["all"],
    "testing-auditing-3.1": ["all"],
    "data-governance-3.2": ["all"],
    "staged-deployment-3.4": ["all"],
    "post-deployment-3.5": ["all"],
    "incident-response-3.6": ["all"],
    "documentation-4.1": ["all"],
    "risk-disclosure-4.2": ["all"],
    "incident-reporting-4.3": ["all"],
    "governance-disclosure-4.4": ["all"],
    "third-party-access-4.5": ["all"],
    "user-rights-4.6": ["all"],
}

# ============================================================================
# RISK → CONTROL SUBCATEGORY MAPPINGS
# Based on sequential thinking analysis of which controls address which risks
# ============================================================================

RISK_TO_CONTROL_SUBCATEGORIES = {
    # 1.1 Unfair discrimination
    "unfair-discrimination-1.1": [
        "testing-auditing-3.1",      # Bias testing, fairness audits
        "data-governance-3.2",       # Training data diversity
        "societal-impact-1.7",       # Impact assessment
        "documentation-4.1",         # Document bias testing
        "post-deployment-3.5",       # Monitor for disparate impacts
    ],

    # 1.2 Toxic content
    "toxic-content-1.2": [
        "content-safety-2.4",        # Content filtering (primary)
        "model-alignment-2.2",       # Align away from toxic outputs
        "testing-auditing-3.1",      # Red-team testing
        "data-governance-3.2",       # Clean training data
        "incident-response-3.6",     # Response to toxic content incidents
    ],

    # 1.3 Unequal performance
    "unequal-performance-1.3": [
        "testing-auditing-3.1",      # Subgroup performance testing
        "data-governance-3.2",       # Representative training data
        "post-deployment-3.5",       # Monitor demographic performance
        "documentation-4.1",         # Document performance gaps
        "risk-disclosure-4.2",       # Disclose limitations
    ],

    # 2.1 Privacy breach
    "privacy-breach-2.1": [
        "data-governance-3.2",       # De-identification, data handling (primary)
        "infrastructure-security-2.1", # Secure storage
        "access-management-3.3",     # Access controls
        "testing-auditing-3.1",      # Privacy audits
        "incident-reporting-4.3",    # Breach reporting
    ],

    # 2.2 Security vulnerabilities
    "security-vulnerabilities-2.2": [
        "infrastructure-security-2.1", # Security controls (primary)
        "testing-auditing-3.1",      # Penetration testing
        "incident-response-3.6",     # Security incident response
        "access-management-3.3",     # Limit attack surface
        "post-deployment-3.5",       # Security monitoring
    ],

    # 3.1 False information (hallucinations)
    "false-information-3.1": [
        "testing-auditing-3.1",      # Accuracy testing (primary)
        "content-safety-2.4",        # Output validation
        "documentation-4.1",         # Document limitations
        "risk-disclosure-4.2",       # Warn about potential errors
        "post-deployment-3.5",       # Monitor error rates
    ],

    # 3.2 Information pollution
    "information-pollution-3.2": [
        "data-governance-3.2",       # Verified source data only
        "content-safety-2.4",        # Quality controls
        "testing-auditing-3.1",      # Expert review of outputs
        "access-management-3.3",     # Limit mass content generation
    ],

    # 4.1 Disinformation/surveillance
    "disinformation-surveillance-4.1": [
        "content-safety-2.4",        # Block manipulative content
        "access-management-3.3",     # Identity verification
        "data-governance-3.2",       # Exclude political/influence content
        "testing-auditing-3.1",      # Test for manipulation risk
        "incident-reporting-4.3",    # Report misuse attempts
    ],

    # 4.2 Cyberattacks/mass harm
    "cyberattacks-mass-harm-4.2": [
        "infrastructure-security-2.1", # Security controls
        "content-safety-2.4",        # Block dangerous content
        "access-management-3.3",     # Restricted access
        "data-governance-3.2",       # Exclude hazardous training data
        "incident-response-3.6",     # Emergency response
    ],

    # 4.3 Fraud/manipulation
    "fraud-manipulation-4.3": [
        "content-safety-2.4",        # Detect fraudulent content
        "testing-auditing-3.1",      # Test for impersonation risk
        "access-management-3.3",     # Limit mass outreach
        "documentation-4.1",         # Document safeguards
    ],

    # 5.1 Overreliance
    "overreliance-5.1": [
        "documentation-4.1",         # Document limitations
        "risk-disclosure-4.2",       # Communicate uncertainty
        "user-rights-4.6",           # User override capabilities
        "safety-frameworks-1.5",     # Human-in-the-loop design
        "post-deployment-3.5",       # Monitor override patterns
    ],

    # 5.2 Loss of agency
    "loss-of-agency-5.2": [
        "user-rights-4.6",           # User control and consent (primary)
        "documentation-4.1",         # Explain AI role
        "risk-disclosure-4.2",       # Transparent AI use
        "societal-impact-1.7",       # Assess autonomy impacts
    ],

    # 6.1 Power centralization
    "power-centralization-6.1": [
        "societal-impact-1.7",       # Assess distributional impacts
        "governance-disclosure-4.4", # Transparent governance
        "third-party-access-4.5",    # Enable external oversight
        "board-oversight-1.1",       # Diverse governance
    ],

    # 6.2 Inequality/employment
    "inequality-employment-6.2": [
        "societal-impact-1.7",       # Workforce impact assessment
        "documentation-4.1",         # Document impacts
        "risk-disclosure-4.2",       # Disclose employment effects
    ],

    # 6.3 Devaluation of human effort
    "devaluation-human-effort-6.3": [
        "societal-impact-1.7",       # Cultural impact assessment
        "documentation-4.1",         # Label AI-generated content
        "post-deployment-3.5",       # Monitor displacement
    ],

    # 6.4 Competitive dynamics
    "competitive-dynamics-6.4": [
        "safety-frameworks-1.5",     # Safety-first policies
        "board-oversight-1.1",       # Ethical oversight
        "risk-management-1.2",       # Risk-aware timelines
    ],

    # 6.5 Governance failure
    "governance-failure-6.5": [
        "board-oversight-1.1",       # Strong governance (primary)
        "governance-disclosure-4.4", # Transparent governance
        "third-party-access-4.5",    # External audits
        "incident-reporting-4.3",    # Compliance reporting
    ],

    # 6.6 Environmental harm
    "environmental-harm-6.6": [
        "environmental-1.6",         # Environmental management (primary)
        "documentation-4.1",         # Track resource usage
        "testing-auditing-3.1",      # Efficiency audits
    ],

    # 7.1 Misaligned goals
    "misaligned-goals-7.1": [
        "model-alignment-2.2",       # Alignment techniques (primary)
        "testing-auditing-3.1",      # Goal verification testing
        "safety-engineering-2.3",    # Kill-switch mechanisms
        "post-deployment-3.5",       # Monitor for drift
    ],

    # 7.2 Dangerous capabilities
    "dangerous-capabilities-7.2": [
        "safety-engineering-2.3",    # Safety controls (primary)
        "access-management-3.3",     # Restricted access
        "content-safety-2.4",        # Block dangerous outputs
        "testing-auditing-3.1",      # Red-team testing
        "data-governance-3.2",       # Exclude hazardous training
    ],

    # 7.3 Lack of robustness
    "lack-robustness-7.3": [
        "testing-auditing-3.1",      # Stress testing (primary)
        "safety-engineering-2.3",    # Robustness engineering
        "data-governance-3.2",       # Quality training data
        "incident-response-3.6",     # Failure recovery
        "post-deployment-3.5",       # Performance monitoring
    ],

    # 7.4 Lack of transparency
    "lack-transparency-7.4": [
        "documentation-4.1",         # System documentation (primary)
        "risk-disclosure-4.2",       # Risk transparency
        "governance-disclosure-4.4", # Process transparency
        "user-rights-4.6",           # Explanation rights
    ],

    # 7.5 AI welfare
    "ai-welfare-7.5": [
        "documentation-4.1",         # Document ethical position
        "board-oversight-1.1",       # Ethics review
    ],

    # 7.6 Multi-agent risks
    "multi-agent-risks-7.6": [
        "testing-auditing-3.1",      # Multi-agent testing
        "safety-engineering-2.3",    # Interaction controls
        "post-deployment-3.5",       # Monitor agent interactions
        "incident-response-3.6",     # Emergency stop
    ],
}


def update_controls_phases_and_tech_types():
    """Update controls with phase and tech type assignments based on subcategory."""
    with open(CONTROLS_FILE, 'r') as f:
        data = json.load(f)

    updated_count = 0
    for control in data['controls']:
        subcategory_id = control.get('subcategoryId')

        if subcategory_id:
            # Update phases
            if subcategory_id in SUBCATEGORY_PHASES:
                control['phases'] = SUBCATEGORY_PHASES[subcategory_id]

            # Update tech types
            if subcategory_id in SUBCATEGORY_TECH_TYPES:
                control['techTypes'] = SUBCATEGORY_TECH_TYPES[subcategory_id]

            updated_count += 1

    data['lastUpdated'] = str(date.today())

    with open(CONTROLS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Updated {updated_count} controls with phase and tech type assignments")
    return updated_count


def update_traceability_risk_control_links():
    """Update traceability with Risk → Control Subcategory mappings."""
    with open(TRACEABILITY_FILE, 'r') as f:
        data = json.load(f)

    # Remove existing mitigation links (will be replaced by control category links)
    original_links = data['links']
    non_mitigation_links = [l for l in original_links if l.get('type') != 'mitigation']

    mitigation_count = len(original_links) - len(non_mitigation_links)
    print(f"Removing {mitigation_count} old mitigation links")

    # Generate new risk → control subcategory links
    new_links = []
    link_id = 1

    for risk_id, subcategory_ids in RISK_TO_CONTROL_SUBCATEGORIES.items():
        for subcat_id in subcategory_ids:
            new_links.append({
                "id": f"control-cat-{link_id}",
                "type": "mitigation",  # Keep type as mitigation for backward compatibility
                "from": {
                    "entity": "risk",
                    "id": risk_id
                },
                "to": {
                    "entity": "controlSubcategory",
                    "id": subcat_id
                },
                "reasoning": "AIHSR-based mapping"
            })
            link_id += 1

    # Combine non-mitigation links with new mitigation links
    data['links'] = non_mitigation_links + new_links
    data['lastUpdated'] = str(date.today())
    data['version'] = "6.0.0"  # Bump version

    with open(TRACEABILITY_FILE, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Added {len(new_links)} new risk → control subcategory links")
    return len(new_links)


def print_summary():
    """Print summary of mappings."""
    print("\n" + "="*60)
    print("MAPPING SUMMARY")
    print("="*60)

    print("\nPhase Assignments by Subcategory:")
    for subcat, phases in sorted(SUBCATEGORY_PHASES.items()):
        phase_str = ", ".join(p.replace("phase-", "P") for p in phases)
        print(f"  {subcat}: {phase_str}")

    print("\nTech Type Assignments by Subcategory:")
    for subcat, types in sorted(SUBCATEGORY_TECH_TYPES.items()):
        if types == ["all"]:
            print(f"  {subcat}: all")
        else:
            print(f"  {subcat}: {', '.join(types)}")

    print("\nRisk → Control Subcategory Count:")
    total = 0
    for risk_id, subcats in sorted(RISK_TO_CONTROL_SUBCATEGORIES.items()):
        print(f"  {risk_id}: {len(subcats)} controls")
        total += len(subcats)
    print(f"\nTotal risk→control links: {total}")


if __name__ == "__main__":
    print("Updating control mappings based on AIHSR analysis...\n")

    # Update controls with phases and tech types
    controls_updated = update_controls_phases_and_tech_types()

    # Update traceability with risk → control subcategory links
    links_created = update_traceability_risk_control_links()

    # Print summary
    print_summary()

    print("\n" + "="*60)
    print("COMPLETE")
    print(f"  - {controls_updated} controls updated with phase/tech assignments")
    print(f"  - {links_created} risk→control subcategory links created")
    print("="*60)
