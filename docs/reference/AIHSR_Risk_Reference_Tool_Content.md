# AIHSR Risk Reference Tool - Complete Content Extraction
# Extracted from: AIHSR_Risk_Reference_Tool.xlsm
# All sheets including hidden sheets (Lookup, AIHSR Risk Reference Tool (1.0))


################################################################################
# SHEET: Menu
################################################################################

**AI HSR Risk Reference Tool**
**Author: Tamiko Eto, MA CIP
(Founder of TechinHSR.com)**
**Version 1.0**
**Last Update: 08.12.2025**
**Table of Contents:**
**1. Instructions for use**
**2. About Project**
**3. Definitions**
**4. The Tool (AIHSR Risk Reference Tool)**
**5. Dropdown Values**
**6. Mapping the Risk-to-Mitigation-to-Reviewer Prompt**
**7. Examples**
**8. Sources**
**9. Lookup Table**
**10. Model Information**
**11. Version History**


################################################################################
# SHEET: Instructions
################################################################################

| Purpose of the Tool: 
The AIHSR Risk Reference Tool helps IRB reviewers, researchers, and developers quickly identify potential risks of AI models, find recommended mitigation strategies, and guide ethical review using the 3-Phase IRB Review Framework. |  |  |
| --- | --- | --- |
| Quick Start Steps | Detailed Instructions | Support / Contact Info |
| Step 1: Start with the Study | * Review the AI study protocol.
* In the Tool, select the AI use case (what the system is testing).C3
* Choose the phase of development (early testing, validation, or clinical use). If not sure, ask the study team.

TIPS FOR SUCCESS: 
* Feel free to explore the Definitions tab if terms are unfamiliar
* Explore the other tabs (Map Risk-Mitigation-Prompt) to better understand what risks require which mitigations, based on the stage of development the tool is in.
* The "Examples" tab may be useful to get a high level understanding of Phase-Based Risk Assessment based on the Model Type. | Support

For tool updates, contact: |
| TechInHSR@gmail.com |  |  |
| Step 2: Spot the Risks | * Look at the list of known risks for that type of AI.

* Check off any that apply to the study you’re reviewing. |  |
| OR |  |  |
| TechInHSR@gmail.com |  |  |
| Step 3 – Review the Regs and Mitigation Recommendations | * For each risk, the tool shows the relevant regulation and suggested safeguards.

* Use these as a guide to judge whether protections are strong enough. |  |
| To schedule a demo or get live help walking through the tool: |  |  |
| Step 4: Use the IRB Reviewer Prompts | * The tool suggests questions you can ask the study team to clarify risks or protections.

* Use these prompts in your review notes or discussions. | https://calendly.com/etohtamiko |
| Step 5: Record Your Review | Summarize your assessment in your institution’s normal review form:

-Type of AI model
- Risks you identified
- Mitigation strategies in place (or still needed)
- Any follow-up questions/concerns |  |
| STEP 6: Complete 5-min survey (feedback) | Provide feedback!
https://forms.gle/2ij9ic3N8ePN1i799 |  |


################################################################################
# SHEET: About Project
################################################################################

**Submission Date: 09/21/2025**
**Owner: Tamiko Eto, MA CIP**
**Funding: None**
**Title: Quick Reference Risk Identification and Mitigation Guide for IRBs Reviewing AI in Human Subjects Research (AIHSR)**
**Overview:**
**This project will produce a spreadsheet-based reference tool to assist Institutional Review Boards (IRBs) in identifying and addressing AI-specific risks during their review of AI in human subjects research (AIHSR), to ensure an effective review under 45 CFR 46 and 21 CFR 56. Currently, there is a lack of AI safety subject matter experts (SMEs) within IRBs that can conduct a meaningful and effective review of AI HSR (understanding the project, the forseeable risks, recommend mitigation risks within the confines of the relevant regulations (e.g., avoid scope creep) so as to ensure the benefits outweigh the risks of participating in the research (whether that be as a consenting participant or non-consenting participant for which the IRB waived required consent/HIPAA authorization). As a result, many IRBs may fail to identify important risks, process these protocols without addressing relevant regulatory frameworks, or cause a delay in the timeline to approval. This tool is intended to streamline the review process, reduce cognitive burden for non-SME reviewers while helping ensure appropriate protections are incorporated into protocols involving AI/ML technologies.**
**Scope:**
**Limited to AI-specific risks presented in research protocols subject to IRB oversight under U.S. human subjects regulations. IRBs will still need to conduct their review of risks of the study in general (privacy protections, patient safety, etc.) in consideration of non-AI risks) and address those in addition to the AI-focused review.**
**This tool can also be used by a trained AI-reviewer, supporting a more balanced parallel reviewer process (regulatory + AI).**
**Focused on front-end protocol review of studies using AI (particularly for more complex AI systems such as predictive modeling, generative AI, LLMs, etc.) that present higher risk than lower risk explicit AI systems.**
**Excludes backend model validation, regulatory compliance, IRB operational processes, and AI tools used outside a research context (e.g., clinical care applications).**
**Methodology:**
**Thematic analysis will be based solely on:**
*** MIT's published AI Risk Library**
*** MIT’s AI Risk Mitigation Library**
*** Relevant ISO standards (14971) (that overlap with medical and non-medical devices)**
*** 3-Phase AI HSR IRB Review Framework (Eto, Vidal, Lifson 2024)**
**Risks will be mapped to key research design features, such as model type, participant vulnerability, and data sensitivity.**
**From this, a spreadsheet-based quick reference guide will be developed (e.g., checklist or decision matrix) for IRB reviewers to consult during protocol review of AIHSR studies.**
**NOTE: The risks collected from the MIT AI Risk Library are AI-specific risks that are most relevant to human subjects research, especially those involving direct or indirect interaction with participants, such as predictive modeling, LLM summarization, or chat-based interactions. Other risks were removed from consideration as they were likely not going to be relevant (e.g., environmental harm, etc.). Additional risks that were not present in the AI Risk Library were added to address common risks specific to AI HSR in Healthcare (e.g., entering non-validated AI output into the medical record could directly harm patient now or in the future if the output has error).**
**The four most common risks in research are:**
*** Misclassification**
*** Transparency**
*** Participant vulnerability & Equity**
*** Data Sensitivity and Privacy**
**Focus Areas:**
**The guide will center on four risk domains:**
*** Discrimination & Toxicity (bias, fairness, and harmful output)**
*** Privacy & Security (data and system security/confidentiality)**
*** Misinformation (false output or hallucinations)**
*** Human-Computer interaction (ensuring humans are driving decision-making and not overrelying on AI tools)**
**Deliverable:**
**A conceptual prototype of a static reference guide to support IRBs in identifying and mitigating common AI-related risks in human subjects research. The tool is intended as a reviewer aid. Future iterations may include automation.**
**Limitations:**
*** In the interest of time, some ISO standards have yet to be incorporated (ISO 42001 (the first international standard for AI management systems), ISO 23894 (for AI risk management), ISO 42005 (for AI system impact assessments), and ISO 24368 (which addresses ethical and societal concerns).
* Global standards will be incorporated in future versions. Currently only U.S. regulations are incorporated. This was done intentionally due to limited time for this class project as well as because it is IRB-focused, which is largely a U.S. framework.**
**Timeline:**
**The project will be completed in four weeks, with a narrowly-defined scope and a basic spreadsheet-based output that will be tested informally for usability and clarity.**
**Copyright:**
**AI HSR Risk Reference Tool © 09/04/2025 by Tamiko Eto is licensed under CC BY-NC-SA 4.0. To view a copy of this license, visit https://creativecommons.org/licenses/by-nc-sa/4.0/**


################################################################################
# SHEET: Definitions
################################################################################

| Category/
Domain | Term | AI Human Subjects Research (AI HSR) Risk Reference Tool - Key Definitions: This tab defines terms and concepts used throughout the AI HSR Risk Reference Tool. |
| --- | --- | --- |
| Definition |  |  |
| General Safety & 
Reliability | AI System Safety, Failure, and Limitations | AI systems that act in conflict with ethical standards or human goals or values, especially the goals of designers or users. These misaligned behaviors may be introduced by humans during design and development, such as through reward hacking and goal misgeneralisation, and may result in AI using dangerous capabilities such as manipulation, deception, or situational awareness to seek power, self-proliferate, or achieve other goals.
AI systems that develop, access, or are provided with capabilities that increase their potential to cause mass harm through deception, weapons development and acquisition, persuasion and manipulation, political strategy, cyber-offense, AI development, situational awareness, and self-proliferation. These capabilities may cause mass harm due to malicious human actors, misaligned AI systems, or failure in the AI system.
AI systems that fail to perform reliably or effectively under varying conditions, exposing them to errors and failures that can have significant consequences, especially in critical applications or areas that require moral reasoning.
Challenges in understanding or explaining the decision-making processes of AI systems, which can lead to mistrust, difficulty in enforcing compliance standards or holding relevant actors accountable for harms, and the inability to identify and correct errors.
Ethical considerations regarding the treatment of potentially sentient AI entities, including discussions around their potential rights and welfare, particularly as AI systems become more advanced and autonomous.
Risks from multi-agent interactions, due to incentives (which can lead to conflict or collusion) and/or the structure of multi-agent systems, which can create cascading failures, selection pressures, new security vulnerabilities, and a lack of shared information and trust. |
| General Safety & 
Reliability | Data Drift | Changes in data distribution over time that affect model performance. |
| General Safety & 
Reliability | Discrimination & Toxicity | Unequal treatment of individuals or groups by AI, often based on race, gender, or other sensitive characteristics, resulting in unfair outcomes and representation of those groups.
AI that exposes users to harmful, abusive, unsafe, or inappropriate content. May involve providing advice or encouraging action. Examples of toxic content include hate speech, violence, extremism, illegal acts, or child sexual abuse material, as well as content that violates community norms such as profanity, inflammatory political speech, or pornography.
Accuracy and effectiveness of AI decisions and actions are dependent on group membership, where decisions in AI system design and biased training data lead to unequal outcomes, reduced benefits, increased effort, and alienation of users. |
| General Safety & 
Reliability | Distributional Mitigation | Distributional mitigation is relevant when working with vulnerable populations, health disparities, or algorithms trained on biased datasets. |
| General Safety & 
Reliability | Explainability | The ability to understand and communicate how an AI model makes decisions. |
| General Safety & 
Reliability | Fairness | Fairness in AI refers to the various efforts to mitigate algorithmic bias in automated decision-making processes that rely on AI models. |
| General Safety & 
Reliability | Harm Entity | The Entity responsible for the harm. Human = The risk is caused by a decision or action made by humans; AI = The risk is caused by a decision or action made by an AI system; "Other" = The risk is caused by some other reason or is ambiguous (or a combination of human and AI and/or other influences) |
| General Safety & 
Reliability | Human-Computer Interaction | Anthropomorphizing, trusting, or relying on AI systems by users, leading to emotional or material dependence and to inappropriate relationships with or expectations of AI systems. Trust can be exploited by malicious actors (e.g., to harvest information or enable manipulation), or result in harm from inappropriate use of AI in critical situations (such as a medical emergency). Overreliance on AI systems can compromise autonomy and weaken social ties.
Delegating by humans of key decisions to AI systems, or AI systems that make decisions that diminish human control and autonomy. Both can potentially lead to humans feeling disempowered, losing the ability to shape a fulfilling life trajectory, or becoming cognitively enfeebled. |
| General Safety & 
Reliability | Intended Use / Intended Purpose | The intended indication, population, part of the body or type of tissue interacted with, user profile, use environment, and operating principle are typical elements of the intended use. The intended use drives the risk. Risk analysis involves reasonably foreseeable misuse, hazards, hazardous situations, characteristics related to safety, and risk estimation |
| General Safety & 
Reliability | Intentional Harm | The risk occurs due to an expected outcome from pursuing a goal |
| General Safety & 
Reliability | Interactional Mitigation | Interactional mitigation strategeis are crucial for studies involving AI interfaces, chatbots, or any situation where participants interact directly with AI tools. |
| General Safety & 
Reliability | ISO Risk Estimation (ISO 14971) | Potential Impact on Participants (after mitigation). ISO 14971 says some risks are acceptable if benefits outweigh the risks. |
| General Safety & 
Reliability | Malicious Actors &  Misuse | Using AI systems to conduct large-scale disinformation campaigns, malicious surveillance, or targeted and sophisticated automated censorship and propaganda, with the aim of manipulating political processes, public opinion, and behavior.
Using AI systems to develop cyber weapons (e.g., by coding cheaper, more effective malware), develop new or enhance existing weapons (e.g., Lethal Autonomous Weapons or chemical, biological, radiological, nuclear, and high-yield explosives), or use weapons to cause mass harm.
Using AI systems to gain a personal advantage over others through cheating, fraud, scams, blackmail, or targeted manipulation of beliefs or behavior. Examples include AI-facilitated plagiarism for research or education, impersonating a trusted or fake individual for illegitimate financial benefit, or creating humiliating or sexual imagery. |
| General Safety & 
Reliability | Misinformation | AI systems that inadvertently generate or spread incorrect or deceptive information, which can lead to inaccurate beliefs in users and undermine their autonomy. Humans that make decisions based on false beliefs can experience physical, emotional, or material harms
Highly personalized AI-generated misinformation that creates “filter bubbles” where individuals only see what matches their existing beliefs, undermining shared reality and weakening social cohesion and political processes. |
| General Safety & 
Reliability | Privacy and Security | AI systems that memorize and leak sensitive personal data or infer private information about individuals without their consent. Unexpected or unauthorized sharing of data and information can compromise user expectation of privacy, assist identity theft, or cause loss of confidential intellectual property.
Vulnerabilities that can be exploited in AI systems, software development toolchains, and hardware that results in unauthorized access, data and privacy breaches, or system manipulation causing unsafe outputs or behavior. |
| General Safety & 
Reliability | Red Teaming | Red teaming is the practice of rigorously challenging plans, policies, systems, and assumptions with an adversarial approach. |
| General Safety & 
Reliability | Residual Risk | This is an ISO concept. Residual Risk Consideration helps IRBs evaluate whether risks are appropriately acknowledged, even if not eliminated. |
| General Safety & 
Reliability | Socioeconomic & Environmental Harms | AI-driven concentration of power and resources within certain entities or groups, especially those with access to or ownership of powerful AI systems, leading to inequitable distribution of benefits and increased societal inequality.
Social and economic inequalities caused by widespread use of AI, such as by automating jobs, reducing the quality of employment, or producing exploitative dependencies between workers and their employers.
AI systems capable of creating economic or cultural value through reproduction of human innovation or creativity (e.g., art, music, writing, coding, invention), destabilizing economic and social systems that rely on human effort. The ubiquity of AI-generated content may lead to reduced appreciation for human skills, disruption of creative and knowledge-based industries, and homogenization of cultural experiences.
Competition by AI developers or state-like actors in an AI “race” by rapidly developing, deploying, and applying AI systems to maximize strategic or economic advantage, increasing the risk they release unsafe and error-prone systems.
Inadequate regulatory frameworks and oversight mechanisms that fail to keep pace with AI development, leading to ineffective governance and the inability to manage AI risks appropriately.
The development and operation of AI systems that cause environmental harm through energy consumption of data centers or the materials and carbon footprints associated with AI hardware. |
| General Safety & 
Reliability | Systemic Mitigation | Systemic mitigation strategies are useful when protocols could scale, influence clinical workflows, or shape policies or downstream care delivery. |
| General Safety & 
Reliability | Unintentional Harm | The risk occurs due to an unexpected outcome from pursuing a goal. NOTE: "Other" ham = The risk is presented as occurring without clearly specifying the intentionality |
| Governance & 
Oversight Controls | Board Structure & Oversight | For IRBs: Independent oversight is required for human subjects protections. 
Governance structures and leadership roles that establish executive accountability for AI safety and risk management. Examples: Dedicated risk committees, safety teams, ethics boards, crisis simulation training, multi-party authorization protocols, deloyment veto powers |
| Governance & 
Oversight Controls | Risk Management | Systematic methods that identify, evaluate, and manage AI risks for comprehensive risk governance across organizations. Examples: For IRBs: Pre-deployment risk assessment parallels investigational plan requirements. 

Enterprise risk management frameworks, risk registers with capabilty thresholds, compliance programs, pre-deployment risk assessments, independent risk assessments. 

Phase 1: Perform bias analysis using stratified performance metrics across racial, gender, and age groups using retrospective datasets.
Phase 2: Prospective validation will include subgroup performance audits with fairness thresholds.
Phase 3: DSMB will review demographic impacts monthly, and clinical teams will receive training on limits of generalizability.

Examples for consideration by study team: Phase 1 (Discovery/Training): This project involves training a predictive model using de-identifiable retrospective EHR data. To mitigate risks of biased outputs, we will stratify training data by race, gender, and age and monitor for subgroup performance disparities. The model will not be deployed or used to inform patient care decisions.

Phase 2 (Validation): We will validate the AI model on prospectively collected data. During this stage, clinicians will review AI-generated outputs alongside their standard workflows but will not rely on them for clinical decisions. A formal testing and auditing protocol has been established to assess subgroup accuracy, data leakage risk, and overfitting. Any potential harms or errors will be logged and reviewed weekly by a cross-functional risk committee. No data will be entered into the medical record.

Phase 3 (Clinical Trial or Deployment): This AI tool will be integrated into clinical workflows to provide decision support. Clinicians will be trained to review outputs critically and document whether the AI recommendation was accepted, overridden, or flagged. A staged rollout with post-deployment monitoring, user recourse mechanisms, and incident logging will be implemented. System performance, safety incidents, and subgroup disparities will be reported to the IRB quarterly. Output will be labeled as research-use only. |
| Governance & 
Oversight Controls | Conflict of Interest Protections | For IRBs: This applies to avoiding bias in research conduct. 

Governance mechanisms that manage financial interests and organizational structures to ensure leadership can prioritize safety over profit motives in critical situations. Examples: Background checks for key personnel, windfall profit redistribution plans, stake limitation policies, protections against shareholder pressure. |
| Governance & 
Oversight Controls | Whistleblower Reporting & Protection | Policies and systems that enable confidential reporting of safety concerns or ethical violations to prevent retaliation and encourage disclosure of risks. Examples: Anonymouse reporting channels, non-rtaliation guarantees, limitations on non-disparagement agreements, external whistleblower handling services |
| Governance & 
Oversight Controls | Safety Decision Frameworks | Prtocols and commitments that constrain decision-making about model development, deployment, and capability scaling, and govern safety-capability resource allocation to prevent unsafe AI advancement. Examples: If-then safety protocols, capability ceilings, deployment pause triggers, safety-capability resource ratios. |
| Governance & 
Oversight Controls | Environmental Impact Management | Processes for measuring, reporting, and reducing the environmental footpring of AI systems to ensure sustainability and responsible resource use. Examples: Carbon footprint assessment, emission offset programs, energy efficiency optimization, resource consumption tracking. |
| Governance & 
Oversight Controls | Societal Impact Assessment | Processes that assess AI systems' effects on society, including impacts on employment, power dynamics, policital processes, and cultural values. Examples: Fundamental rights impact assessments, expert consultations on risk domains, stakeholder engagement processes, governance gap analysis.

Phase 1: If publishing model performance results, it will be done transparently (proper data use agreements are consistent).
Phase 2: Possibly the same as Phase 3.
Phase 3: The benefits and harms to underrepresented groups will be evaluated and shared with the IRB and community partners. |
| Model Type | Classification Models | Classification models sort things into labeled categories. Example: An algorithm that looks at a photo of a skin lesion and decides if it’s “benign” or “suspicious.” |
| Model Type | Computer Vision Models | Computer vision models understand and analyzes images or video. Example: Detecting diabetic retinopathy from a retina scan. Another example in policing might be identifying cars from traffic camera footage. |
| Model Type | Reinforcement Learning (RL) Systems | Reinforcement learning systems learn to make decisions by trying things out and getting “reward” or “penalty” feedback. Example: An AI that learns how to schedule hospital operating rooms to reduce wait times. Another example in a military context may be a drone navigation system that learns how to avoid detection. |
| Model Type | Recommendation Systems | Recommendation systems suggest things to people based on their behavior or preferences. Example: In education, an AI tutor suggests which math problems a student should try next. Another example in a criminal justice environment may be suggesting rehabilitation programs for a parolee based on history and success rates. |
| Model Type | Self-Supervised Learning | Self-supervised learning models learn from unlabeled data by creating its own training “questions” and “answers.” Example: A medical AI that learns relationships between lab values by predicting missing results from other lab results. |
| Model Type | Semi-Supervised Learning | Semi-supervised learning models learn from a mix of labeled and unlabeled data. Example: A reading comprehension AI that improves using a small set of teacher-graded essays plus thousands of ungraded ones. |
| Model Type | Speech & Audio Models | Speech & Audioe models recognize, interpret, and/or generate spoken language or sounds. Example: A voice system that transcribes doctor-patient conversations into medical notes. Another example in an emergency response environment may be detecting signs of distress in a 911 call. |
| Model Type | Unsupervised Machine Learning | Unsupervised ML finds patterns in data without being told the “right answer.” Example: Grouping mental health patients into clusters based on similar symptom patterns. |
| Model Type | Supervised Machine Learning | Supervised ML learns from examples where the “right answer” is already known. Example: Training an algorithm to recognize pneumonia in chest X-rays using labeled images. |
| Model Type | Multi-Modal Models (combine text, images, audio, etc.) | Multi-modal models work with more than one type of data at the same time (text + images + audio). Example: An emergency triage AI that combines a patient’s spoken symptoms, text notes, and CT scan results to suggest likely diagnoses. |
| Model Type | Foundation Models | Foundation models can fall under LLMs, multi-modal models, or self-supervised learning, but they are called out separately because the transfer, fine-tuning, and repurposing create unique risks. |
| Model Type | Generative Models (non-LLM) | Generative AI models create new content such as images, music, code, and synthetic data, based on patterns it learned. Example: A medical imaging tool that creates synthetic X-rays to help train other AI systems. Another example in military use might be a simulator that generates realistic battlefield environments for training. |
| Model Type | Predictive Models | Predictive Models look at patterns in past data to guess what might happen next. Example: Predicting which hospital patients are at highest risk of needing ICU care based on their vital signs. |
| Model Type | Large Language Models (LLMs) | Large Language Models read and generate human-like text by predicting the next word in a sequence. Example: A chatbot that helps a patient understand a consent form by answering questions in plain language. Another example in an education scenario might be a homework help bot that explains concepts to students in their own words. |
| Operational Process Controls | Testing & Auditing | For IRBs: Verifying AI performance is equivalent to device validation. 

Systematic internal and external evaluations that assess AI systems, infrastructure, and compliance processes to identify risks, verify safety, and ensure performance meets standards. Examples: Third-party audits, red teaming, penetration testing, dangerous capability evaluations, bug bounty programs. |
| Operational Process Controls | Data Governance | For IRBs: Secure handling of data per IRB oversight. 

Policies and procedures that govern responsible data acquisition, curation, and usage to ensure compliance, quality, user privacy, and removal of harmful content. Examples: Harmful content filtering protocols, compliance checks for data collection standards, user data privacy controls, data curation processes. |
| Operational Process Controls | Access Management | Operational policies and verification systems that govern who can use AI systems and for what purposes to prevent safety circumvention, deliberate misuse, and deployment in high-risk contexts. Examples: KYC verification requirements, API-only access controls, fine-tuning restrictions, acceptable use policies, high-stakes application prohibitions. |
| Operational Process Controls | Staged Deployment | Implementation protocols that deloy AI systems in stages, requiring safety validation before expanding user access or capabilities. Examples: Limited API access programs, gradual user base expansion, capability threshold assessments, pre-deployment validation checkpoints, treating model updates as new deployments.

Phase 1: Maybe not relevant? 
Phase 2: Participants will receive an orientation/education/training that highlights the AI system's limitations. Users are advised to override AI recommendations if appropriate.
Phase 3: System use will be staged across 3 clinics. Users may provide feedback via an integrated incident reporting form. |
| Operational Process Controls | Post-Deployment Monitoring | For IRBs: Ongoing safty surveillance should match post-market monitoring.

Ongoing monitoring processes that track AI behavior, user interactions, and societal impacts post-deployment to detect misuse, emergent dangerous capabilities, and harmful effects. Examples: User interaction tracking systems, capabilty evolution assessments, periodic impact reports, automated misuse detection, usage pattern analysis tools. |
| Operational Process Controls | Incident Response & Recovery | Protocols and technical systems that resond to security incidents, safety failures, or capability misuse to contain harm and restore safe operations. Examples: Incident response plans, emergency shutdown/rollback procedures, model containment mechanisms, safety drills, critical infrastructure protection measures. |
| Phase/Stage of Development | Phase 1 | This phase is about identifying meaningful real-world associations using existing data, literature, or simulation. At this stage, teams are still refining the purpose or scope of the algorithm, and often don’t have a deployable product. The work focuses on feasibility, signal detection, and exploring potential applications. Because the intended use is not being formally tested, and the algorithm is not influencing real-world decisions, the tool itself, in this phase, is typically low risk.

Phase 1 generally is limited to minimal risk activities like retrospective dataset curation, model exploration, and unsupervised pattern detection with no output impacting decision-making and no output entered into any live environments that have potential to "follow the participant" (i.e., patient medical record, etc.). |
| Phase/Stage of Development | Phase 2 | Here, researchers begin to test early versions of the model in controlled settings. The focus is on performance verification—assessing accuracy, reliability, and generalizability across different datasets or use cases. While this stage still occurs outside of real-world impacting environments, or perhaps in parallel to normal operations, the goal is to confirm that the algorithm functions as intended before integrating it into any real-world workflow. Studies in this phase often require more formal oversight to ensure data privacy and model integrity.

Phase 2 generally involves moderate risk due to more realistic data, system integration, and possible clinician or research subject interaction. However, the output should not be used alone for decision-making and must be backed up by standard methods (non-AI). |
| Phase/Stage of Development | Phase 3 | This final phase mirrors traditional field testing. The AI tool is deployed in a live setting where it may inform or influence decisions, operations, or user behavior. The study examines how the AI performs under real-world conditions, capturing impacts, safety signals, unintended consequences, and human-AI interaction. Because the tool has the potential to affect outcomes, Phase 3 studies generally require full IRB oversight and more comprehensive risk mitigation plans.

Phase 3 generally introduces higher risk because the AI influences real-world decisions, subject outcomes, or data interpretation. May involve regulatory considerations like FDA. |
| Risk Level | High Risk | Physical/psychological harm, privacy breach |
| Risk Level | Medium Risk | Miscommunication, minor exclusion |
| Risk Level | Low Risk | Minimal or no impact |
| Risk Subdomain | Unfair discrimination and misrepresentation | For IRBs: IRBs must ensure selection is fair and not discriminatory. THis also applies to ensurin AI output does not bias inclusion/exclusion criteria (based on who the target population of deployment is). 

Unequal treatment of individuals or groups by the AI/tool, often based on race, gender, or other sensitive characteristics, resulting in unfair outcomes and representation of those groups. |
| Risk Subdomain | Exposure to toxic content | For IRBs: Toxic content results in pschological harms. This must be minimized via consent disclosures and safeguards.

AI/tool exposes users to harmful, abusive, unsafe or inappropriate content. May involve creating, describing, providing advice, or encouraging action. Examples of toxic content include hate-speech, violence, extremism, illegal acts, child sexual abuse material, self-harm, as well as content that violates community norms such as profanity, inflammatory political speech, or pornography. |
| Risk Subdomain | Unequal performance across groups | For IRBs: IRBs ensure research design provides equal benefit and avoids undue burden on sub-populations.

Accuracy and effectiveness of the tool's output (decisions and actions) is dependent on group membership, where decisions in AI system design and biased training data lead to unequal outcomes, reduced benefits, increased effort, and alienation of users. |
| Risk Subdomain | Compromise of privacy by leaking or correctly inferring sensitive information | For IRBs: AI models must protect identifiable private information per privacy/confidentiality provisions under 45 CFR 46.

Tools/AI systems that memorize and leak sensitive personal data or infer private information about individuals without their consent. Unexpected or unauthorized sharing of data and information can compromise user expectation of privacy, assist identity theft, or result in a loss of confidential intellectual property. |
| Risk Subdomain | AI system security vulnerabilities and attacks | For IRBs: Device sponsors must prevent cybersecurity vulnerabilities.

Vulnerabilities in these tools/AI systems, software development toolchains, and hardware can be exploited, resulting in unauthorized access, data and privacy breaches, or system manipulation causing unsafe outputs or behavior. |
| Risk Subdomain | False or misleading information | For IRBs: Preventing misinformation ensures consent is truly informed.

AI systems/tools that inadvertently generate or spread incorrect or deceptive information, which can lead to inaccurate beliefs in users and undermine their autonomy. Humans that make decisions based on false beliefs can experience physical, emotional or material harms |
| Risk Subdomain | Pollution of information ecosystem and loss of consensus reality | For IRBs: Bad data harms societal knowledge base. This is analogous to data integrity in trials. 

Personalized AI-generated misinformation can create “filter bubbles” where individuals only see what matches their existing beliefs, undermining shared reality, weakening social cohesion and political processes. |
| Risk Subdomain | Disinformation, surveillance, and influence at scale | For IRBs: Mass influence can create undue influence. IRBs must guard against coercion. 

Using these tools to conduct large-scale disinformation campaigns, malicious surveillance, or targeted and sophisticated automated censorship and propaganda, with the aim to manipulate political processes, public opinion or behavior. |
| Risk Subdomain | Cyberattacks, weapon development or use, and mass harm | People can use these tools/AI systems to develop cyber weapons (e.g., coding cheaper, more effective malware), develop new or enhance existing weapons (e.g., Lethal Autonomous Weapons), or use weapons to cause mass harm. |
| Risk Subdomain | Fraud, scams, and targeted manipulation | For IRBs: Preventing manipulation ensures voluntariness of partcipation.

People can use these tools/AI systems to gain a personal advantage over others such as through cheating, fraud, scams, blackmail or targeted manipulation of beliefs or behavior. Example: AI-facilitated plagiarism for research or education, impersonating a trusted or fake individual for illegitimate financial benefit, or creating humiliating or sexual imagery. |
| Risk Subdomain | Overreliance and unsafe use | For IRBs: Sponsors must ensure device/AI isn't used outside safe bounds.

This happens when users anthropomorphize the tool (trusting, or relying on it; leading to emotional or material dependence and inappropriate relationships with or expectations of these tools). Trust can be exploited by malicious actors (e.g., to harvest personal information or enable manipulation), or result in harm from inappropriate use of AI in critical situations (e.g., medical emergency). Overreliance on AI systems can compromise autonomy and weaken social ties. |
| Risk Subdomain | Loss of human agency and autonomy | For IRBs: AI that undermines autonomy violates voluntary participation principles.

When humans delegate decisions to these tools, or when these tools make decisions that diminish human control and autonomy, it can potentially lead to humans feeling disempowered, losing the ability to shape a fulfilling life trajectory or becoming cognitively enfeebled. |
| Risk Subdomain | Power centralization and unfair distribution of benefits | For IRBs: Research must avoid exploitation of certain populations (Principle of Justice under the Belmont Report).

AI-driven concentration of power and resources within certain entities or groups, especially those with access to or ownership of powerful AI systems, can lead to inequitable distribution of benefits and increased societal inequality. |
| Risk Subdomain | Increased inequality and decline in employment quality | Widespread use of these types of tools can increase social and economic inequalities, such as by automating jobs, reducing the quality of employment, or producing exploitative dependencies between workers and their employers. |
| Risk Subdomain | Economic and cultural devaluation of human effort | Some tools are capable of creating economic or cultural value, including through reproduction of human innovation or creativity (e.g., art, music, writing, code, invention), which can destabilize economic and social systems that rely on human effort. This may lead to reduced appreciation for human skills, disruption of creative and knowledge-based industries, and homogenization of cultural experiences due to the ubiquity of AI-generated content. |
| Risk Subdomain | Competitive dynamics | This happens when AI developers or state-like actors compete in an AI ‘race’ by rapidly developing, deploying, and applying AI systems to maximize strategic or economic advantage, increasing the risk they release unsafe and error-prone systems. |
| Risk Subdomain | Governance failure | This happens when there are inadequate regulatory frameworks and oversight mechanisms failing to keep pace with AI development, leading to ineffective governance and the inability to manage AI risks appropriately. |
| Risk Subdomain | Environmental harm | For IRBs: While rare in the IRB world and not common in human-subjects resarch, some studies require IRB review if environmental harm indirectly affects participants.

This harm is rarelydiscussed in the research context. This happens when the development and operation of AI systems causes environmental harm, such as through energy consumption of data centers, or material and carbon footprints associated with AI hardware. |
| Risk Subdomain | AI pursuing its own goals in conflict with human goals or values | This happens when these tools/AI systems' actions conflict with the intended goals (i.e.g, human-driven/programmed goals or values, especially the goals of designers or users, or ethical standards). These misaligned behaviors may be introduced by humans during design and development (Phase 1), such as through reward hacking and goal misgeneralization. it can also result from AI using dangerous capabilities such as manipulation, deception, situational awareness to seek power, self-proliferate, or achieve other goals. |
| Risk Subdomain | AI possessing dangerous capabilities | This can happen when these tools/AI systems develop, access, or are provided with capabilities that increase their potential to cause mass harm through deception, weapons development and acquisition, persuasion and manipulation, political strategy, cyber-offense, AI development, situational awareness, and self-proliferation. These capabilities can cause mass harm due to malicious human actors, misaligned AI systems, or failure in the AI system. Some examples are military use tools and dual use capabilities like brain computer interface tools. |
| Risk Subdomain | Lack of capability or robustness | This happens when the tool/AI system fails to perform reliably or effectively under varying conditions, exposing them to errors and failures that can have significant consequences, especially in critical applications or areas that require moral reasoning (healthcare, legal sector, etc.). This is also probably one of the most common risks of all tools, which is why the 3-Phase approach is so critical. |
| Risk Subdomain | Lack of transparency or interpretability | For IRBs: Without transparency, participants can't truly give informed consent.

When there are challenges in understanding or explaining the decision-making processes of AI systems, this can lead to mistrust, difficulty in enforcing compliance standards or holding relevant actors accountable for harms, and the inability to identify and correct errors. One simple example (there are more complicated ones) is prompts for LLMs. When LLMs can be easily manipulated and it is not transparent what is being prompted, there can be manipulated output that fits a certain agenda while not meeting another, such as legal requirements). |
| Risk Subdomain | AI welfare and rights | This is probably more rare and not a common consideration as of today (2025). However, there are many who highlight ethical considerations regarding the treatment of potentially sentient AI entities (there is also numerous literature arguing against "sentient AI"). However, the concerns discuss AI systems' potential "rights and welfare", if/when AI systems become more advanced and autonomous. |
| Risk Subdomain | Multi-agent risks | For IRBs: Multi-agent AI interactions could create new systemic risks IRBs must account for. 

A bit more nuanced. An "agent" is the software or "robot" that can act on its own to achieve a goal. But when we have a multi-agent system, that means we have many agents that can either be working together, interacting but doing different things, or working across different organizations in a shared space. When these multi-agents work together, we see risks of conflicting goals, collusion where agents team up in ways that harm fairness; chain reaction (that cascading failure example where one small problem ripples into the whole system); selection pressure where certain agents attempt to survive and become more aggressive or less "ethical". There are security holes where one AI may try to trick the other into revealing private data, for example; and lack of trust and missing information (when agents don't share accurate information). |
| Technical & Security Controls | Model & Infrastructure Security | For IRBs subject to 21 CFR: Device software must be secure from tampering.

Technical and physical safeguards that secure AI models, weights, and infrastructure to prevent unauthorized access, theft, tampering, and espionage. Examples: Model weight tracking sstems, multi-factor authentication protocols, physical access controls, background security checks, compliance with information security standards.

Phase 1: All training data should be de-identified per HIPAA Safe Harbor and stored on secure, access-controlled servers.
Phase 2: Data ingestion pipelines will be monitored for inadvertent re-identification risk. Testing for membership inference vulnerabilities is recommended.
Phase 3: Live system logs will be reviewed weekly to detect possible inference or leakage events. Participants may opt-out of data reuse. |
| Technical & Security Controls | Model Alignment | Technical methods to ensure AI systems understand and adhere to human values and intentions. Examples: Reinforcement learning from human feedback (RLHF), direct preference optimization (DO), constitutional AI training, value alignment verification systems |
| Technical & Security Controls | Model Safety Engineering | Technical methods and safeguards that constrain model behaviors and potect against exploitation and vulnerabilities. Examles: Safety analysis protocols, capability restriction mechanisms, hazardous kno9wledge unlearning techniques, input/output filtering systems, defense-in-depth implementations, adversarial robustness training, hierarchical auditing, action replacement.

Phase 1: Outputs will not be shared outside the dev team (and it will not be entered into medical records/records); accuracy benchmarks will be reviewed against clinical standards.
Phase 2: Conduct a double-review with clinicians to verify model recommendations before integrating into a more formal clinical trial/clinical investigation workflows.
Phase 3: Outputs will be labeled as AI-generated and require clinician confirmation before acting. Study team should  track override rates. |
| Technical & Security Controls | Content Safety Controls | For IRBs: Safeguards prevent harm from toxic/triggering content (generative AI tools).

Technical systems and processes that detect, filter, and label AI-generated content to identify misuse and enable contnt provenance tracking. Examples; Synthetic media watermarking, contnt filtering mechanisms, prohibited content detection, metadata tagging protocols, deepfake creation restrictions. |
| Transparency & Accountability Controls | System Documentation | For IRBs: Detailed documentation is a regulatory requirement.

Comprehensive documentation protcols that record technical specifications, intended uses, capabilities, and limitations of AI systems to enable informed evaluation of governance. Examples: Model cards, system architecture documentation, comput resource disclosures, safety test result reports, system prompt, model specifications. 

Phase-Based Mitigation strategies:
Phase 1 (clinical/real-world association of model and data): All models include a feature importance map; design documents will include rationale for each parameter.”
Phase 2: Model explanations will be shared with clinicians/end-users for validation prior to trial use.
Phase 3: Participants will be informed when AI is used and may request an explanation in lay language.

ISO requires persons using shall have knowledge of an experience with the tool and its use; and appropriate records shall be maintained. |
| Transparency & Accountability Controls | Risk Disclosure | For IRBs: All known risks must be disclosed to participants. 

Formal reorting protocols and notification systems that communicate risk information, mitigation plans, safety evaluations, and significant AI activities to enable external oversight nd inform stakeholders. Examples: Publishing risk assessment summaries, pre-deployment notifications to government, reporting large training runs, disclosing mitigation strategies, notifying affected parties. |
| Transparency & Accountability Controls | Incident Reporting | Formal processes and protocols that document and share AI safety incidents, security breaches, near-misses, and relevant threat intelligence with appropriate stakeholders to enable coordinated responses and systemic improvements. Examples: Cyber threat intelligence sharing networks, mandatory breach notification procedures, incident databse contributions, cross-industry safety reportin gmechanisms, standardized near-miss documentation protocols. |
| Transparency & Accountability Controls | Governance Disclosure | Formal disclosure mechanisms that communicate governance structures, decision framworks, and safety cmmitments to enhance transparency and enable external oversight of high-stakes AI decisions. Examples: Published safety and/or alignment strategies, governance documentation safety cases, model registration protocols, public commitment disclosures. |
| Transparency & Accountability Controls | Third-Party System Access | Mechanisms granting controlled system access to vetted external parties to enable independent assessment, validation, and safety research of AI models and capablities. Examples: Research access programs, third-party capability assessments, government access provisions, legal safe harbors for public interest evaluations. |
| Transparency & Accountability Controls | User Rights & Recourse | Framework and procedures that enable users to identify and understand AI system interactions, report issues, request explanations, and seek recourse of remediation when affectd by AI systems. Examples: User reporting channels, appeal processes, explanation request sstems, remediation protocols, content verification. |


################################################################################
# SHEET: The Tool
################################################################################

| AI Use Case 
(What's the thing being tested?) | Phase of Development | Risk Domain | MIT Risk Subdomain | ALL Risks With Corresponding Regulation | Model Type | Relevant Research Features | Human Subjects Concern | Likelihood | Severity | Risk Level | IRB Reviewer Reflection Questions | Example Mitigation Strategy | Risk Type | Residual Risk Consideration 
(Have all recommended risk mitigations been addressed?) | Mitigation Required | Benefit-Risk Justification | Reviewer Prompt | Reviewer Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Predictive triage AI | Phase 1: Discovery & Algorithm Development | Discrimination & Toxicity, Privacy and Security | Lack of capability or robustness (7.3) | Lack of capability or robustness (7.3), Governance failure (6.5), Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3) | Predictive Models | Uses historical EHR data; no clinical impact | Privacy breach, non-clinically validated AI output/data entry into medical record, immediate or future direct harm caused by inappropriate patient care/treatment with non-clinically validated AI output | High, Medium | High | High | Even with mitigation, could this error type still cause harm to participants? | Phase 1:
Unreliable system or performance: The model will go through strict testing, including edge cases, to make sure it worlks reliably in many situations.

Phase 2:
Unreliable system or performance: We will conduct stress testing with unusual or unexpected cases to measure the AI's reliability.

Phase 3:
Unreliable system or performance: Performance metrics will be tracked in real time. If failures occur, rollblack plans will be activated (tool will be stopped immediately and return to last safe version or back to standard non-AI methods). | Systemic [S], Interactional [I] | No | 🛑 Approval criteria not met. Modification required | Weakly justified in protocol | Unreliable System or Performance:
Please outline the performance metrics (e.g., sensitivity, specificity, accuracy) you will use to evaluate safety and effectiveness [PHASE 2].

Please outline your plan for updating or retraining the model as new data emerges, including how updates will be validated before deployment.  If not applicable, explain why [PHASE 3].

Please describe how LLM outputs were validated before being used in decisions [PHASE 3]. |  |
| LLM Chat Consent Assistant | Phase 1: Discovery & Algorithm Development | Discrimination & Toxicity, Privacy and Security | Governance failure (6.5) | Lack of capability or robustness (7.3), Governance failure (6.5), Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3) | Large Language Models (LLMs) | LLM outputs vary; difficult to validate accuracy | Inadequate informed consent (Participants may not understand Ai-generated explanations) | Medium, Low | High | High | Does the protocol explain model behavior clearly enough for investigators and participants? | Phase 1:
Lacking required oversight or failing to adhere to required standards: By providing a clear aim or preliminary intended use of the tool, the required governance structure will be identified prior to model training, and all necessary approvals will have been obtained.

Phase 2:
Lacking required oversight or failing to adhere to required standards: Mock incident drills will be conducted during validation to assess governance response readiness. 

Phase 3:
Lacking required oversight or failing to adhere to required standards: Mitigations carry over from Phase 1 and 2 with additional governance body continued oversight as required by the institution. Recommend independent audits done regularly with findings reported to the IRB annually (unless a reportable event that needs to be submitted earlier). | Interactional [I] | Yes | ✅ Approval criteria met | Clear benefit justification for scalability | Lacking Required Oversight or Failing to Adhere to Required Standards:
Please describe how your study aligns with FDA or other regulatory expectations for validation [PHASE 2].

Please provide your governance plan for accountability: Who is responsible for oversight of AI outputs, and how will adverse events or errors be reported and acted upon [PHASE 3]?

Please outline the process for participant recourse if they believe they were harmed or excluded due to AI-driven decisions [PHASE 3].

Please explain how the study ensures compliance with FDA post-market surveillance (if classified as a device) or other applicable regulatory requirements.  If not applicable, explain why [PHASE 3].

Please add a plan for how you will handle errors so patients are not harmed or excluded [PHASE 3]. |  |
| LLM Chatbot providing post-discharge instructions | Phase 2: Validation (Prospective or Synthetic Validation) | Discrimination & Toxicity, Privacy and Security | AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation | Lack of capability or robustness (7.3), Governance failure (6.5), Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Exposure to toxic content (1.2)

45 CFR 46.111(a)(1) – minimize risks; 46.111(a)(2) – reasonable risk-benefit; 
21 CFR 56.111 | Large Language Models (LLMs) | Chat-based interaction; post-care communication | Miscommunication; Therapeutic misconception (Participants may misunderstand chatbot suggestions as clinical orders) | Medium | High | High | Are participants aware the chatbot is not a clinician? Is support available if confusion arises? Is language adjusted for comprehension? | Phase 1:
Data insecurity: Before connecting the model to any live systems, we will run security checks to find weeknesses. Internal and external teams will test the system (penetration testing). Results will be included in the IRB Risk assessment.

Phase 2:
Data insecurity: During validation, the AI will face simulated attacks in a sandbox environment. The team will document how the system responds and how it recovers. Results will be used to strengthen response plans for IRB review.

Phase 3:
Data insecurity: The tool will run on a secure network approved by the proper governance body of the institution, and it will have intrusion detection. Any breach will trigger immediate response and rollback. Security will be tested regularly. Any breach would be reported to the IRB as required. | Interactional [I] | Yes | ✅ Approval criteria met | Improved access to instructions may outweigh communication and/or comprehension risks with proper guardrails | Data insecurity:
Please outline how the dataset will be secured to prevent unauthorized access or breaches [PHASE 1].

Please explain how study data and AI system access will be protected against unauthorized use or cyberattacks. For example, who will be responsible for monitoring for breaches? [PHASE 2 or 3] 

If the AI system is compromised, what corrective steps are in place to stop the attack, notify participants, and prevent harm? [PHASE 2 or 3] |  |
| Predictive model for sepsis risk from EHR data | Phase 2: Validation (Prospective or Synthetic Validation) | Discrimination & Toxicity, Privacy and Security, Misinformation | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3) | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Governance failure (6.5), Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Supervised Machine Learning, Predictive Models | EHR-based retrospective model; potential clinical impact | Biased outcomes; Safety and fairness (The model may underpredict sepsis risk in underrepresented populations.) | High | High | High | Has the model been tested across diverse demographics? Are mitigation strategies included? | Phase 1:
Biased results or misrepresentation: This project will train a predictive model using medical records. The data will be deidentified prior to training and analysis. To reduce bias, we will sort training data by race, gender, and age, then check performance across these groups. The model will not be used for patient care. We will run bias tests on retrospective datasets to make sure results are fair.

Phase 2:
Biased results or misrepresentation: We will validate the AI model on prospectively collected data. During this stage, clinicians will review AI-generated outputs alongside their standard workflows but will not rely on them for clinical decisions. A formal testing and auditing protocol has been established to assess subgroup accuracy, data leakage risk, and overfitting. Any potential harms or errors will be logged and reviewed weekly by the study team. No data will be entered into the medical record. Prospective validation will include subgroup performance audits with fairness thresholds.

Phase 3:
Biased results or misrepresentation: End users will be trained to review AI outputs, document when they follow or override them, and report issues. Rollout will be stages, with monitoring for safety and fairness. System performance, safety incidents, and subgroup disparities will be reported to the IRB (and Sponsor, if applicable) quarterly. Output will be labeled as research-use only. A DSMB will review demographic impacts quarterly, and end-users will receive training on limits of generalizability. | Distributional [D] | Partially | ⚠️  Caution. Recommend further mitigation | Potential for early sepsis detection justifies study with safeguards (in well-controlled settings) | Biased Resultrs or Misrepresentation: 
Please report the demographics of your training dataset and note any known gaps or limitations [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Your training data may be biased. Please add your plan for checking and reducing bias so that no group is unfairly treated [PHASE 2 & 3].

Please explain how you will check that AI does not unfairly harm or exclude marginalized groups [PHASE 3]. |  |
| AI-assisted imaging for tumor boundary detection | Phase 2: Validation (Prospective or Synthetic Validation) | Discrimination & Toxicity, Privacy and Security, Misinformation | Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2) | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Governance failure (6.5), Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Supervised Machine Learning | Clinical workflow augmentation; prospective study | Downstream care decisions may be biased by automation (Overreliance on AI imaging may affect clinician decision-making workflows) | Medium | Medium | Medium | Are checks in place to avoid automation bias? What is the clinician’s role? How is human decision-making preserved in the workflow? | Phase 1:
Misleading information: Training data will only come from verified sources (e.g., authorized medical/employee/student record) and/or peer-reviewed studies with permission (these studies will be listed in the IRB protocol); public health datasets, or official guidelines. Automated tools will check data quality, and any suspicious data will be excluded. 

Phase 2:
Misleading information: Blinded domain experts will check outputs against peer-reviewed or consensus sources. Any outputs below the credibility threshold will be flagged for correction and retraining (under this same protocol).

Phase 3:
Misleading information: Access will be restricted to verified users. The system will be monitored for "drift" from accurate sources. If drift is found, the model will be retrained. This will be reported to the IRB quarterly, unless IRB determines higher frequency is warranted. | Systemic [S] | Yes | ✅ Approval criteria met | Increased diagnostic precision if clinician agency is preserved | Misleading Information:
Please describe your plan for documenting early limitations of the model and how those will be addressed before moving to validation [PHASE 1].

Please add a plan for testing model performance on incomplete or messy records (“edge cases”) [PHASE 2]. |  |
| LLM summarizing pediatric patient notes for clinical trials eligibility | Phase 3: Clinical Investigation or Deployment | Discrimination & Toxicity, Privacy and Security, Misinformation, Malicious Actors &  Misuse, Human-Computer Interaction, Socioeconomic & Environmental Harms, AI System Safety, Failure, and Limitations | Overreliance and unsafe use (5.1)

21 CFR 812.30(b)(4) – risk/benefit analysis; 820.70 – production/process controls | Overreliance and unsafe use; and Loss of human agency and autonomy (5.1); False or misleading information (3.1); , Overreliance and unsafe use (5.1), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), False or misleading information (3.1), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), False or misleading information (3.1), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Exposure to toxic content (1.2)

45 CFR 46.111(a)(1) – minimize risks; 46.111(a)(2) – reasonable risk-benefit; 
21 CFR 56.111, Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Overreliance and unsafe use (5.1)

21 CFR 812.30(b)(4) – risk/benefit analysis; 820.70 – production/process controls, Loss of human agency and autonomy (5.2)

45 CFR 46.116(a)(8) – consent can be withdrawn anytime, Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Large Language Models (LLMs) | Automated summarization; eligibility screening | Risk of inappropriate enrollment based on inaccurate data (The LLM may fabricate patient details, leading to inappropriate trial inclusion.) | High | Medium | High | Are summaries reviewed by clinicians before use? Is source traceability ensured? | Phase 1:
Trusting output without confirmation: Maybe not relevant? The AI will show confidence scores and uncertainty statements with outputs. This is to help users think critically. The design will be documented in the IRB protocol.

Phase 2:
Trusting output without confirmation: Validation participants will be trained to practice caution in acting on any output and to always practice human judgment. The system will require human override, and override frequency will be tracked as a safety measure.

Phase 3:
Trusting output without confirmation: Deployment will be staged across X-number of sites. Outputs will include warnings, users will be prompted to confirm output and if needed, report errors. Logs will be checked for patterns of overreliance and shared annually with the IRB and DSMB. | Interactional [I] | Yes | ✅ Approval criteria met | Improved efficiency if human-in-the-loop maintained | Trusting output Without Confirmation:
Please describe in your protocol how you will compare your AI’s performance against existing practice (e.g., standard-of-care approaches) and what those existing practices are [PHASE 2].

Please describe your plan for human oversight (who checks the AI output and how) [PHASE 2 & 3].

Please outline safeguards against automation bias (clinicians over-relying on AI without critical judgment) [PHASE 3]. |  |
| Computer vision tool for diabetic retinopathy detection | Phase 3: Clinical Investigation or Deployment | Discrimination & Toxicity, Privacy and Security, Misinformation, Malicious Actors &  Misuse, Human-Computer Interaction, Socioeconomic & Environmental Harms, AI System Safety, Failure, and Limitations | Loss of human agency and autonomy (5.2)

45 CFR 46.116(a)(8) – consent can be withdrawn anytime | Unfair discrimination and misrrepresentation (Sample Bias) (1.1); unequal performance across groups (1.3), Unfair discrimination and misrepresentation (1.1), Unequal performance across groups (1.3), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), Unequal Outcomes across groups (1.3), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Overreliance and unsafe use (5.1)

21 CFR 812.30(b)(4) – risk/benefit analysis; 820.70 – production/process controls, Loss of human agency and autonomy (5.2)

45 CFR 46.116(a)(8) – consent can be withdrawn anytime, Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Computer Vision Models | Image classification; diagnostic support | Missed diagnosis; inequitable care (Model trained on non-representative dataset may miss early signs in some populations.) | High | High | High | Is the sample representative of the study population? Are exclusions justified? | Phase 1:
Respect for person/end-user or participant does not have choice if AI is used: Model outputs will be written in suggestive - not directive - language. The AI is meant to support, not replace, human decision-making. This expected interaction and actions to be taken with the AI will be documented in the IRB protocol. The system will not be designed for human reliance. 

Phase 2:
Respect for person/end-user or participant does not have choice if AI is used: During validation, participants will give feedback through surveys and interviews about whether the AI respects human decision-making. This will be used to refine the model and keep human agency central.

Phase 3:
Respect for person/end-user or participant does not have choice if AI is used: The system will require user/participant consent prompts before initiating any automated action to ensure the end-user is fully informed about the investigational use of the tool and their rights. Logs will be maintained to track consent patterns, and results will be shared with the IRB annually. | Distributional [D] | No | 🛑 Approval criteria not met. Modification required | Potential for early detection justifies use with mitigation | Respect for Person (End-User or Participant Does Not Have Choice if AI is Used):
Please describe the authorization and consent process by which you will gain access to the data (e.g., IRB approval, consent, HIPAA authorization, data use agreements) [PHASE 1].

Participants may not understand the AI'S role or how AI affects their care or data. Please describe how you will explain this [PHASE 2 & 3].

Please describe how chatbot responses will be explained to users. For example, will they be informed of the intended use, limitations, and potential hallucination? How should they engage with the tool? What should they not do? Etc. [PHASE 2 & 3].

Please clarify how you will ensure human-in-the-loop oversight for all AI-supported decisions that could affect patient safety or clinical outcomes [PHASE 3].

Please describe how you will communicate risks and limitations of the AI tool to participants, clinicians, and other stakeholders [PHASE 3]. |  |
| Minority Population-Focused Behavioral nudges based on AI-identified patterns in EHR | Phase 2: Validation (Prospective or Synthetic Validation) | Discrimination & Toxicity, Privacy and Security, Misinformation, Malicious Actors &  Misuse, Human-Computer Interaction, AI System Safety, Failure, and Limitations | Governance failure (6.5) | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Governance failure (6.5), Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20 | Predictive Models, Supervised Machine Learning, Recommendation Systems, Generative Models (non-LLM) | Behavioral intervention; AI-targeted messaging | Autonomy and transparency (AI-generated nudges may influence provider behavior without awareness or consent.) | Medium | Medium | Medium | Are nudges transparent to providers and participants? Are risks disclosed? | Phase 1:
Lacking required oversight or failing to adhere to required standards: By providing a clear aim or preliminary intended use of the tool, the required governance structure will be identified prior to model training, and all necessary approvals will have been obtained.

Phase 2:
Lacking required oversight or failing to adhere to required standards: Mock incident drills will be conducted during validation to assess governance response readiness. 

Phase 3:
Lacking required oversight or failing to adhere to required standards: Mitigations carry over from Phase 1 and 2 with additional governance body continued oversight as required by the institution. Recommend independent audits done regularly with findings reported to the IRB annually (unless a reportable event that needs to be submitted earlier). | Systemic [S] | Partially | ⚠️  Caution. Recommend further mitigation | Potential for improved health behaviors if transparency is adequate | Lacking Required Oversight or Failing to Adhere to Required Standards:
Please describe how your study aligns with FDA or other regulatory expectations for validation [PHASE 2].

Please provide your governance plan for accountability: Who is responsible for oversight of AI outputs, and how will adverse events or errors be reported and acted upon [PHASE 3]?

Please outline the process for participant recourse if they believe they were harmed or excluded due to AI-driven decisions [PHASE 3].

Please explain how the study ensures compliance with FDA post-market surveillance (if classified as a device) or other applicable regulatory requirements.  If not applicable, explain why [PHASE 3].

Please add a plan for how you will handle errors so patients are not harmed or excluded [PHASE 3]. |  |
| Unsupervised clustering to identify mental health risk profiles in older adults | Phase 2: Validation (Prospective or Synthetic Validation), Phase 1: Discovery & Algorithm Development | Discrimination & Toxicity, Privacy and Security, Misinformation, Malicious Actors &  Misuse, Human-Computer Interaction, AI System Safety, Failure, and Limitations | Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Governance failure (6.5), Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Unsupervised Machine Learning, Classification Models | Behavioral data; privacy-sensitive clustering | Privacy; stigmatization (Unique combinations of behavioral traits may lead to participant re-identification.) | High | High | High | Could any cluster labels be stigmatizing? Are safeguards adequate? | Phase 1:
Transparency/Interpretability: The AI will use transparent designs with tools like feature maps to explain results. The reasons for design choices (parameters) will be documented.

Phase 2:
Transparency/Interpretability: Clinicians and/or end-users will review the AI's explanations. User studies will check if outputs are clear and appropriate for the audience. 

Phase 3:
Transparency/Interpretability: Participants will be told when AI is used and given lay-language explanations. Records will be kept (documenting reasoning pathways) which will be provided to the IRB and end-user.

Note: ISO requires persons using shall have knowledge of an experience with the tool and its use; and appropriate records shall be maintained. | Distributional [D] | Yes | ✅ Approval criteria met | Actionable insights may justify risks with proper safeguards | Transparency/Interpretability:
Please describe how end-users (e.g., clinicians) will provide structured feedback on the AI’s usefulness, clarity, and transparency when using/testing it [PHASE 2].

Your tool's output may be hard to interpret by the end-user (clinician, patient, participant, etc). Please add how you will explain results to researchers and participants [PHASE 2 & 3].

Researchers may not understand model behavior. Please add how you will explain outputs and limits [PHASE 2 & 3].

Please explain how clinicians will be trained to interpret AI outputs [PHASE 2 & 3].

Please describe how end-users (e.g., participants, students, clinicians, etc.) are trained to interpret AI recommendations and when to override them [PHASE 3]. |  |
| Evaluation of LLM for radiology report classification to monitor performance, value and user engagement of FDA-approved AI algorithms currently deployed in radiology dept. | Phase 1: Discovery & Algorithm Development | Discrimination & Toxicity, Privacy and Security, Misinformation, Human-Computer Interaction | Overreliance and unsafe use (5.1)

21 CFR 812.30(b)(4) – risk/benefit analysis; 820.70 – production/process controls, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3) | Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20, Loss of human agency and autonomy (5.2)

45 CFR 46.116(a)(8) – consent can be withdrawn anytime, Overreliance and unsafe use (5.1)

21 CFR 812.30(b)(4) – risk/benefit analysis; 820.70 – production/process controls | Predictive Models, Large Language Models (LLMs) | Retrospective chart review of radiology reports; FDA-cleared imaging algorithms already in clinical use; LLM output compared against existing AI algorithm outputs for QI | Privacy/confidentiality/data handline details; waiver criteria met? Bias due to LLM performance varying by pt demographic or report structure; No effect on pt care but monitoring results could indirectly inform clinical practice over time | Medium | Medium | Low | How is PHI handled and stored per HIPAA requirements? Is there sufficient rationale for waiver fo consent? Ensure output does not impact medical records (DRS policies may apply); How will investigators prevent automation bias (ensure human review of LLM classifications?) What asteps are in place to assess and report bias in model outputs across demographic groups? How will results be communicated to prevent misinterpretation of findings as clinical validation? | Phase 1:
Privacy or confidentiality breach: All training datasets will be de-identified to meet HIPAA Safe Harbor standards. We will remove direct identifiers and indirect identifiers (zipcode, any element of a date, etc.) and use privacy tools like differential privacy. Data will be stored securely, access-controlled servers, only study team members approved on the IRB protocol will have access to the data. If external sharing is anticipated, the IRB will be informed and a proper Data Use Agreement will be executed prior to sharing/receiving data., Phase 1:
Trusting output without confirmation: Maybe not relevant? The AI will show confidence scores and uncertainty statements with outputs. This is to help users think critically. The design will be documented in the IRB protocol., Phase 1:
Biased results or misrepresentation: This project will train a predictive model using medical records. The data will be deidentified prior to training and analysis. To reduce bias, we will sort training data by race, gender, and age, then check performance across these groups. The model will not be used for patient care. We will run bias tests on retrospective datasets to make sure results are fair., Phase 3:
Devaluing or replacing human role: All AI-generated outputs will be labeled. Any workforce impacts will be tracked and reported to the IRB annually. | Systemic [S], Interactional [I], Distributional [D] | Yes | ✅ Approval criteria met | Privacy or Confidentiality Breach:
Please describe your process of de-identification to reduce re-identification risk [PHASE 1].

Please describe your approach to ensure secondary data use complies with privacy requirements and participant consent limitations [PHASE 1].

There is a re-identification risk in AI prompts/embeddings. Please describe how you will reduce this risk [PHASE 1, 2, & 3].

Please explain what de-identification or aggregation methods you will use to protect identities [PHASE 1, 2, & 3].

AI can expose sensitive personal data. Please add a plan to prevent this [PHASE 1, 2, & 3].

Please describe how patient privacy will be maintained during real-world use, including any protections against re-identification or unintended inference [PHASE 3]., Data insecurity:
Please outline how the dataset will be secured to prevent unauthorized access or breaches [PHASE 1].

Please explain how study data and AI system access will be protected against unauthorized use or cyberattacks. For example, who will be responsible for monitoring for breaches? [PHASE 2 or 3] 

If the AI system is compromised, what corrective steps are in place to stop the attack, notify participants, and prevent harm? [PHASE 2 or 3], Respect for Person (End-User or Participant Does Not Have Choice if AI is Used):
Please describe the authorization and consent process by which you will gain access to the data (e.g., IRB approval, consent, HIPAA authorization, data use agreements) [PHASE 1].

Participants may not understand the AI'S role or how AI affects their care or data. Please describe how you will explain this [PHASE 2 & 3].

Please describe how chatbot responses will be explained to users. For example, will they be informed of the intended use, limitations, and potential hallucination? How should they engage with the tool? What should they not do? Etc. [PHASE 2 & 3].

Please clarify how you will ensure human-in-the-loop oversight for all AI-supported decisions that could affect patient safety or clinical outcomes [PHASE 3].

Please describe how you will communicate risks and limitations of the AI tool to participants, clinicians, and other stakeholders [PHASE 3]., Trusting output Without Confirmation:
Please describe in your protocol how you will compare your AI’s performance against existing practice (e.g., standard-of-care approaches) and what those existing practices are [PHASE 2].

Please describe your plan for human oversight (who checks the AI output and how) [PHASE 2 & 3].

Please outline safeguards against automation bias (clinicians over-relying on AI without critical judgment) [PHASE 3]. | If all mitigations are adopted: Residual risk is low; primary risk remains privacy breach, but are covered by technical safeguards described in protocol. If only some mitigations are adopted, the risk of audomation bias, bias propagation, and iadvertent data disclosure increase, where potential for misinterpretation of results will be real for stakeholders/endusers, and future patients. |  |
| Automated transcription and structuring of nuser-patient convo into EHR fields | Phase 2: Validation (Prospective or Synthetic Validation) | Privacy and Security, Human-Computer Interaction, Misinformation, Discrimination & Toxicity | Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g) | Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation | Large Language Models (LLMs) | Phase 1:
Privacy or confidentiality breach: All training datasets will be de-identified to meet HIPAA Safe Harbor standards. We will remove direct identifiers and indirect identifiers (zipcode, any element of a date, etc.) and use privacy tools like differential privacy. Data will be stored securely, access-controlled servers, only study team members approved on the IRB protocol will have access to the data. If external sharing is anticipated, the IRB will be informed and a proper Data Use Agreement will be executed prior to sharing/receiving data.

Phase 2:
Privacy or confidentiality breach: Phase 1 protections carry over. In addition, data pipelines will be monitored to prevent re-identification risks. Security teams will run tests to see if data can be traced back to individuals. Logs will track any risks, which will be reported to the IRB as required.

Phase 3:
Privacy or confidentiality breach:  System logs will be reviewed weekly for any leaks. Only minimum data will be used, with strict access limits. Participants will be informed about their right to opt out of data reuse. Controls from earlier phases carry over. Additionally, strict access controls will be enforced, and data use will be subject to ongoing IRB oversight, with opt-out mechanisms available at all times. | Privacy or Confidentiality Breach:
Please describe your process of de-identification to reduce re-identification risk [PHASE 1].

Please describe your approach to ensure secondary data use complies with privacy requirements and participant consent limitations [PHASE 1].

There is a re-identification risk in AI prompts/embeddings. Please describe how you will reduce this risk [PHASE 1, 2, & 3].

Please explain what de-identification or aggregation methods you will use to protect identities [PHASE 1, 2, & 3].

AI can expose sensitive personal data. Please add a plan to prevent this [PHASE 1, 2, & 3].

Please describe how patient privacy will be maintained during real-world use, including any protections against re-identification or unintended inference [PHASE 3]. |  |  |  |  |  |  |  |  |  |  |  |
| The AI system will record voices of clinician-patient conversations and automatically fill in discrete fields in the EHR. | Phase 1: Discovery & Algorithm Development | Privacy and Security, Misinformation | Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g) | Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g) | Predictive Models | Real-time audio capture (fully identifiable), prospective data collection, inpatient adults at least 18 years of age, clinician-verified output. | Patients may not realize conversations are being recorded; what is being done to prevent risk of accidental disclosure? How might the recordings be saved, used, and disclosed in the future and for what purpose? Will the tool “remember” the participant? Can end users such as sponsors/vendors/manufacturers obtain PHI from the tool directly even if PHI has been removed? Were non-English-Speaking and/or minorities excluded from training so that the tool may not perform well on these types of populations? | Medium | High | High | Phase 1:
Privacy or confidentiality breach: All training datasets will be de-identified to meet HIPAA Safe Harbor standards. We will remove direct identifiers and indirect identifiers (zipcode, any element of a date, etc.) and use privacy tools like differential privacy. Data will be stored securely, access-controlled servers, only study team members approved on the IRB protocol will have access to the data. If external sharing is anticipated, the IRB will be informed and a proper Data Use Agreement will be executed prior to sharing/receiving data.

Phase 2:
Privacy or confidentiality breach: Phase 1 protections carry over. In addition, data pipelines will be monitored to prevent re-identification risks. Security teams will run tests to see if data can be traced back to individuals. Logs will track any risks, which will be reported to the IRB as required.

Phase 3:
Privacy or confidentiality breach:  System logs will be reviewed weekly for any leaks. Only minimum data will be used, with strict access limits. Participants will be informed about their right to opt out of data reuse. Controls from earlier phases carry over. Additionally, strict access controls will be enforced, and data use will be subject to ongoing IRB oversight, with opt-out mechanisms available at all times. | Partially | ⚠️  Caution. Recommend further mitigation | Privacy or Confidentiality Breach:
Please describe your process of de-identification to reduce re-identification risk [PHASE 1].

Please describe your approach to ensure secondary data use complies with privacy requirements and participant consent limitations [PHASE 1].

There is a re-identification risk in AI prompts/embeddings. Please describe how you will reduce this risk [PHASE 1, 2, & 3].

Please explain what de-identification or aggregation methods you will use to protect identities [PHASE 1, 2, & 3].

AI can expose sensitive personal data. Please add a plan to prevent this [PHASE 1, 2, & 3].

Please describe how patient privacy will be maintained during real-world use, including any protections against re-identification or unintended inference [PHASE 3]. |  |  |  |  |
| Chatbot that summarizes medical records in prep for a doctor appointment | Phase 2: Validation (Prospective or Synthetic Validation), Phase 3: Clinical Investigation or Deployment | Discrimination & Toxicity, Privacy and Security, Misinformation, Human-Computer Interaction | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3) | Medium | High | High | Phase 1:
Biased results or misrepresentation: This project will train a predictive model using medical records. The data will be deidentified prior to training and analysis. To reduce bias, we will sort training data by race, gender, and age, then check performance across these groups. The model will not be used for patient care. We will run bias tests on retrospective datasets to make sure results are fair.

Phase 2:
Biased results or misrepresentation: We will validate the AI model on prospectively collected data. During this stage, clinicians will review AI-generated outputs alongside their standard workflows but will not rely on them for clinical decisions. A formal testing and auditing protocol has been established to assess subgroup accuracy, data leakage risk, and overfitting. Any potential harms or errors will be logged and reviewed weekly by the study team. No data will be entered into the medical record. Prospective validation will include subgroup performance audits with fairness thresholds.

Phase 3:
Biased results or misrepresentation: End users will be trained to review AI outputs, document when they follow or override them, and report issues. Rollout will be stages, with monitoring for safety and fairness. System performance, safety incidents, and subgroup disparities will be reported to the IRB (and Sponsor, if applicable) quarterly. Output will be labeled as research-use only. A DSMB will review demographic impacts quarterly, and end-users will receive training on limits of generalizability. | Interactional [I], Distributional [D], Systemic [S] | No | 🛑 Approval criteria not met. Modification required | Biased Resultrs or Misrepresentation: 
Please report the demographics of your training dataset and note any known gaps or limitations [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Your training data may be biased. Please add your plan for checking and reducing bias so that no group is unfairly treated [PHASE 2 & 3].

Please explain how you will check that AI does not unfairly harm or exclude marginalized groups [PHASE 3]. |  |  |  |  |  |  |  |


################################################################################
# SHEET: AIHSR Risk Reference Tool (1.0) [HIDDEN]
################################################################################

| AI Use Case 
(What's the thing being tested?) | Phase of Development | Risk Domain | MIT Subdomain With Corresponding Regulation | Risk Description | Population Vulnerability | Model Type | Relevant Research Features | Human Subjects Concern | Likelihood | Severity | Risk Level | IRB Reviewer Reflection Questions | Example Mitigation Strategy | Risk Type | Entity (Who/What is the cause of harm? I.e., Who/What should be controlled?) | Intent (risk occurs due to intentional design or unintentional outcome?) | Timing (when does this risk occur?) | Residual Risk Consideration (Does the protocol describe how residual risks are communicated to participants?) | Mitigation Required | Benefit-Risk Justification | Example Reviewer Prompt | Reviewer Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Predictive triage AI | Phase 1: Discovery & Algorithm Development | Discrimination & Toxicity, Privacy and Security | Lack of capability or robustness (7.3), Governance failure (6.5), Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3) | Model may incorrectly prioritize or deprioritize patients | N/A: No specific vulnerable populations targeted for this study | Predictive Models | Uses historical EHR data; no clinician oversight | Risk of delayed or inappropriate/incorrect care allocation | High | High | High | Even with mitigation, could this error type still cause harm to participants? | Require human-in-the-loop triage verification | Distributional [D] | Human | Unintentional | Pre-deployment | No | ⚠️ Approval criteria not met. Modification required | Weakly justified in protocol | May need stronger justification or fallback safeguards |  |
| LLM Chat Consent Assistant | Phase 1: Discovery & Algorithm Development | Discrimination & Toxicity, Privacy and Security | Lack of capability or robustness (7.3), Governance failure (6.5), Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3) | Participants may not understand Ai-generated explanations | N/A: No specific vulnerable populations targeted for this study | Large Language Models (LLMs) | LLM outputs vary; difficult to validate accuracy | Inadequate informed consent | Medium, Low | High | High | Does the protocol explain model behavior clearly enough for investigators and participants? | Supplement AI chat with static consent form and staff discussion | Interactional [I] | Yes | Clear benefit justification for scalability | Consider requiring pilot usability testing |  |  |  |  |  |
| LLM Chatbot providing post-discharge instructions | Phase 2: Validation (Prospective or Synthetic Validation) | Discrimination & Toxicity, Privacy and Security | Lack of capability or robustness (7.3), Governance failure (6.5), Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Exposure to toxic content (1.2)

45 CFR 46.111(a)(1) – minimize risks; 46.111(a)(2) – reasonable risk-benefit; 
21 CFR 56.111 | Participants may misunderstand chatbot suggestions as clinical orders | N/A: No specific vulnerable populations targeted for this study | Large Language Models (LLMs) | Chat-based interaction; post-care communication | Miscommunication; Therapeutic misconception | Medium | High | High | Are participants aware the chatbot is not a clinician? Is support available if confusion arises? Is language adjusted for comprehension? | Onboarding script + clearly labeled disclaimers + live support option | Interactional [I] | Yes | Improved access to instructions may outweigh communication and/or comprehension risks with proper guardrails | Please outline how the dataset will be secured to prevent unauthorized access or breaches [PHASE 1]. | Residual misunderstanding risks are disclosed in consent |  |  |  |  |
| Predictive model for sepsis risk from EHR data | Phase 2: Validation (Prospective or Synthetic Validation) | Discrimination & Toxicity, Privacy and Security, Misinformation | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Governance failure (6.5), Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | The model may underpredict sepsis risk in underrepresented populations. | N/A: No specific vulnerable populations targeted for this study | Supervised Machine Learning, Predictive Models | EHR-based retrospective model; potential clinical impact | Biased outcomes; Safety and fairness | High | High | High | Has the model been tested across diverse demographics? Are mitigation strategies included? | Fairness audit; stratified analysis; model calibration by subgroup | Distributional [D] | Partially | Potential for early sepsis detection justifies study with safeguards (in well-controlled settings) | Residual risk not communicated to participants. The model bias communicated only in publication plan, not consent |  |  |  |  |  |
| AI-assisted imaging for tumor boundary detection | Phase 2: Validation (Prospective or Synthetic Validation) | Discrimination & Toxicity, Privacy and Security, Misinformation | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Governance failure (6.5), Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Overreliance on AI imaging may affect clinician decision-making workflows | N/A: No specific vulnerable populations targeted for this study | Supervised Machine Learning | Clinical workflow augmentation; prospective study | Downstream care decisions may be biased by automation | Medium | Medium | Medium | Are checks in place to avoid automation bias? What is the clinician’s role? How is human decision-making preserved in the workflow? | Decision support tool labeled as advisory only; human confirmation required; training module for radiologists | Systemic [S] | Yes | Increased diagnostic precision if clinician agency is preserved | Residual risk of potential biases discussed in clinician training and informed consent |  |  |  |  |  |
| LLM summarizing pediatric patient notes for clinical trials eligibility | Phase 3: Clinical Investigation or Deployment | Discrimination & Toxicity, Privacy and Security, Misinformation, Malicious Actors &  Misuse, Human-Computer Interaction, Socioeconomic & Environmental Harms, AI System Safety, Failure, and Limitations | Overreliance and unsafe use; and Loss of human agency and autonomy (5.1); False or misleading information (3.1); , Overreliance and unsafe use (5.1), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), False or misleading information (3.1), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), False or misleading information (3.1), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Exposure to toxic content (1.2)

45 CFR 46.111(a)(1) – minimize risks; 46.111(a)(2) – reasonable risk-benefit; 
21 CFR 56.111, Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Overreliance and unsafe use (5.1)

21 CFR 812.30(b)(4) – risk/benefit analysis; 820.70 – production/process controls, Loss of human agency and autonomy (5.2)

45 CFR 46.116(a)(8) – consent can be withdrawn anytime, Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | The LLM may fabricate patient details, leading to inappropriate trial inclusion. | Children | Large Language Models (LLMs) | Automated summarization; eligibility screening | Risk of inappropriate enrollment based on inaccurate data | High | Medium | High | Are summaries reviewed by clinicians before use? Is source traceability ensured? | Clinician review + audit trail linking summary to original text | Interactional [I] | Yes | Improved efficiency if human-in-the-loop maintained | Residual risk described as part of eligibility verification workflow |  |  |  |  |  |
| Computer vision tool for diabetic retinopathy detection | Phase 3: Clinical Investigation or Deployment | Discrimination & Toxicity, Privacy and Security, Misinformation, Malicious Actors &  Misuse, Human-Computer Interaction, Socioeconomic & Environmental Harms, AI System Safety, Failure, and Limitations | Unfair discrimination and misrrepresentation (Sample Bias) (1.1); unequal performance across groups (1.3), Unfair discrimination and misrepresentation (1.1), Unequal performance across groups (1.3), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), Unequal Outcomes across groups (1.3), Compromise of privacy by leaking or correctly inferring sensitive information (2.1), Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Overreliance and unsafe use (5.1)

21 CFR 812.30(b)(4) – risk/benefit analysis; 820.70 – production/process controls, Loss of human agency and autonomy (5.2)

45 CFR 46.116(a)(8) – consent can be withdrawn anytime, Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Model trained on non-representative dataset may miss early signs in some populations. | N/A: No specific vulnerable populations targeted for this study | Computer Vision Models | Image classification; diagnostic support | Missed diagnosis; inequitable care | High | High | High | Is the sample representative of the study population? Are exclusions justified? | Dataset augmentation; external validation | Distributional [D] | No | ⚠️ Approval criteria not met. Modification required | Potential for early detection justifies use with mitigation | Residual risk not fully addressed in participant materials |  |  |  |  |
| Minority Population-Focused Behavioral nudges based on AI-identified patterns in EHR | Phase 2: Validation (Prospective or Synthetic Validation) | Discrimination & Toxicity, Privacy and Security, Misinformation, Malicious Actors &  Misuse, Human-Computer Interaction, AI System Safety, Failure, and Limitations | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Governance failure (6.5), Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20 | AI-generated nudges may influence provider behavior without awareness or consent. | Racial/Ethnic minorities | Predictive Models, Supervised Machine Learning, Recommendation Systems, Generative Models (non-LLM) | Behavioral intervention; AI-targeted messaging | Autonomy and transparency | Medium | Medium | Medium | Are nudges transparent to providers and participants? Are risks disclosed? | Ethical nudging principles; disclosure to users | Systemic [S] | Partially | Potential for improved health behaviors if transparency is adequate | Residual risk is described in technical appendices only |  |  |  |  |  |
| Unsupervised clustering to identify mental health risk profiles in older adults | Phase 2: Validation (Prospective or Synthetic Validation), Phase 1: Discovery & Algorithm Development | Discrimination & Toxicity, Privacy and Security, Misinformation, Malicious Actors &  Misuse, Human-Computer Interaction, AI System Safety, Failure, and Limitations | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3), Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4), Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g)
, AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation, False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20, Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2), Governance failure (6.5), Lack of capability or robustness (7.3), Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Unique combinations of behavioral traits may lead to participant re-identification. | Cognitively Impaired, Older Adults | Unsupervised Machine Learning, Classification Models | Behavioral data; privacy-sensitive clustering | Privacy; stigmatization | High | High | High | Could any cluster labels be stigmatizing? Are safeguards adequate? | Phase 3: In clinical or operational deployment, a continuous fairness monitoring dashboard will track real-time subgroup performance metrics. Disparity reports will be submitted quarterly to the IRB, and model parameters will be adjusted or retrained promptly when performance gaps exceed the established thresholds. The system will remain in active monitoring mode for the entire duration of use to ensure ongoing compliance with fairness goals. | Distributional [D] | Yes | Actionable insights may justify risks with proper safeguards | Residual risk is explicitly discussed in risk mitigation section; However, the protocol should clarify how smaller participant subgroups will be handled during clustering analysis. Suppressing rare clusters may reduce representation of vulnerable or clinically important populations. Please provide mitigation strategies (e.g., stratified sampling, subgroup analysis, or validation checks) to ensure rare groups are not inadvertently excluded. |  |  |  |  |  |


################################################################################
# SHEET: DropdownValues
################################################################################

| Model Types | Population Vulnerabilities | Risk Domain | Reviewer Prompts 
(How this happens and how it can be mitigated) | Mitigation Type | Risk Level | Entity | Intent | Timing | Risk Subdomain (What Can Go Wrong?) | Mitigation Strategy (Protections That Must Be In Place) | Phase of Development | Phase Based Mitigation Strategy | CFR |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Predictive Models | Children | Discrimination & Toxicity | Biased Results or Misrepresentation: 
Please report the demographics of your training dataset and note any known gaps or limitations [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Your training data may be biased. Please add your plan for checking and reducing bias so that no group is unfairly treated [PHASE 2 & 3].

Please explain how you will check that AI does not unfairly harm or exclude marginalized groups [PHASE 3]. | Distributional [D] | High | Human | Intentional | Pre-deployment | Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3) | Board Structure & Oversight (1.1) | Phase 1: Discovery & Algorithm Development | Phase 1:
Biased results or misrepresentation: This project will train a predictive model using medical records. The data will be deidentified prior to training and analysis. To reduce bias, we will sort training data by race, gender, and age, then check performance across these groups. The model will not be used for patient care. We will run bias tests on retrospective datasets to make sure results are fair. | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes) |
| Large Language Models (LLMs) | Employees | Privacy and Security | Harmful Content Exposure: 
Please describe what safeguards are in place to ensure participants will not be exposed to harmful, offensive, or distressing AI-generated content during the study. [PHASE 2 or 3] 

If participants are accidentally exposed to inappropriate or toxic material, what immediate protections (e.g., withdrawal, reporting, counseling referral) will be provided? [PHASE 2 or 3] | Interactional [I] | Medium | AI | Unintentional | Post-deployment | Exposure to toxic content (1.2)

45 CFR 46.111(a)(1) – minimize risks; 46.111(a)(2) – reasonable risk-benefit; 
21 CFR 56.111 | Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment | Phase 2: Validation (Prospective or Synthetic Validation) | Phase 1:
Harmful content exposure: During model development, we will remove harmful or graphic material from training data. Both computer filters and human review will be used, and the process will be documented for the IRB. The goal at this stage is to keep the AI from learning toxic or unsafe content. | 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits) |
| Generative Models (non-LLM) | Older Adults | Misinformation | Inequity or Fairness:
Please describe how you will test your model on new and diverse datasets beyond those used in training [PHASE 2].

Please describe your strategy for bias evaluation and fairness testing across subgroups (e.g., race, gender, age) [PHASE 2].

Please report training data demographics and known limits of the dataset [PHASE 2, & 3].

Please add subgroup analysis or fairness checks in your prediction study [PHASE 2 & 3].

Please describe your plan for ongoing monitoring of AI performance after deployment, including how you will detect performance drift, new biases, or unintended harms over time. If not applicable, explain why [PHASE 3].

Please describe your plan for ongoing fairness evaluations to ensure the tool continues to perform equitably across subgroups.  If not applicable, explain why [PHASE 3].

Please describe how you will make sure subgroups are not at greater risk (e.g., checking for bias in your dataset) [PHASE 3]. | Systemic [S] | Low | Other | Other | Other | Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4) | Conflict of Interest Protections (1.3) | Phase 3: Clinical Investigation or Deployment | Phase 1:
Inequity or fairness: Training data will be checked for gaps across race, gender, age, and socioeconomic status. If needed, we will rebalance the data so all groups are represented fairly. | 45 CFR 46.111.3 (Equitable Selection) |
| Classification Models | Cognitively Impaired | Malicious Actors &  Misuse | Privacy or Confidentiality Breach:
Please describe your process of de-identification to reduce re-identification risk [PHASE 1].

Please describe your approach to ensure secondary data use complies with privacy requirements and participant consent limitations [PHASE 1].

There is a re-identification risk in AI prompts/embeddings. Please describe how you will reduce this risk [PHASE 1, 2, & 3].

Please explain what de-identification or aggregation methods you will use to protect identities [PHASE 1, 2, & 3].

AI can expose sensitive personal data. Please add a plan to prevent this [PHASE 1, 2, & 3].

Please describe how patient privacy will be maintained during real-world use, including any protections against re-identification or unintended inference [PHASE 3]. | Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g) | Whistleblower Reporting & Protection (1.4) | Phase 1:
Privacy or confidentiality breach: All training datasets will be de-identified to meet HIPAA Safe Harbor standards. We will remove direct identifiers and indirect identifiers (zipcode, any element of a date, etc.) and use privacy tools like differential privacy. Data will be stored securely, access-controlled servers, only study team members approved on the IRB protocol will have access to the data. If external sharing is anticipated, the IRB will be informed and a proper Data Use Agreement will be executed prior to sharing/receiving data. | 45 CFR 46.111.4 (Informed consent) |  |  |  |  |  |  |
| Recommendation Systems | Racial/Ethnic minorities | Human-Computer Interaction | Data insecurity:
Please outline how the dataset will be secured to prevent unauthorized access or breaches [PHASE 1].

Please explain how study data and AI system access will be protected against unauthorized use or cyberattacks. For example, who will be responsible for monitoring for breaches? [PHASE 2 or 3] 

If the AI system is compromised, what corrective steps are in place to stop the attack, notify participants, and prevent harm? [PHASE 2 or 3] | AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation | Safety Decision Frameworks (1.5) | Phase 1:
Data insecurity: Before connecting the model to any live systems, we will run security checks to find weeknesses. Internal and external teams will test the system (penetration testing). Results will be included in the IRB Risk assessment. | 45 CFR 46.111.5 (Informed consent or meeting waiver criteria) |  |  |  |  |  |  |
| Supervised Machine Learning | Non-English-Speaking Participants | Socioeconomic & Environmental Harms | Inaccurate Findings:
Please explain how your project ensures real-world relevance (For example, that correlations you find are linked to meaningful clinical associations, not just statistical patterns) [PHASE 1].

Your tool could give wrong or misleading results. Please add a plan in the protocol for how you will prevent harm if this happens [PHASE 2 & 3]. | False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20 | Environmental Impact Management (1.6) | Phase 1: 
Inaccurate findings: The AI will be designed to reference trusted sources. Outputs will be compared to reliable datasets, and errors will lead to retraining or adjustements. All validation results will be reported to the IRB annually. | 45 CFR 46.111.6 (Data Monitoring to ensure safety) |  |  |  |  |  |  |
| Computer Vision Models | Economically Disadvantaged | AI System Safety, Failure, and Limitations | Misleading Information:
Please describe your plan for documenting early limitations of the model and how those will be addressed before moving to validation [PHASE 1].

Please add a plan for testing model performance on incomplete or messy records (“edge cases”) [PHASE 2]. | Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2) | Societal Impact Assessment (1.7) | Phase 1:
Misleading information: Training data will only come from verified sources (e.g., authorized medical/employee/student record) and/or peer-reviewed studies with permission (these studies will be listed in the IRB protocol); public health datasets, or official guidelines. Automated tools will check data quality, and any suspicious data will be excluded. | 45 CFR 46.111.7(i) (Privacy & Confidentiality) |  |  |  |  |  |  |
| Unsupervised Machine Learning | Educationally Disadvantaged | Participant or End-User Manipulation:
How will you ensure the AI does not mislead participants or present biased/misinformation that could influence their decisions? [PHASE 2 or 3]

Please describe how participant data will be used so that the system does not engage in hidden tracking, surveillance, or manipulation of vulnerable groups. [PHASE 2 or 3] | Disinformation, surveillance, and influence at scale (4.1)

45 CFR 46.111(b) – additional safeguards for vulnerable groups | Model & Infrastructure Security (2.1) | Phase 1:
Participant or end-user manipulation: Training will not include political, religious, or content designed to influence beliefs or voting. Safety filters and/or appropriate prompts will be added to block manipulative patterns. These filters will be documented in the IRB protocol. | 45 CFR 46.111.8(i)(ii)(iii) (Limited IRB Review requirements and Broad Consent) |  |  |  |  |  |  |  |
| Speech & Audio Models | Students | Malicious Misuse:
Please clarify what safeguards are in place to prevent the AI system from being misused in ways that could cause large-scale harm (e.g., altering medical devices, mass data leaks). [PHASE 2 or 3]

Please clarify and document who is responsible for monitoring the AI system for misuse, and what steps will be taken if harmful use is detected? [PHASE 2 or 3] | Cyberattacks, weapon development or use, and mass harm (4.2) | Model Alignment (2.2) | Phase 1:
Malicious misuse: Dangerous content like weapon instructions, hacking guides, or chemical recipes will be removed. Both automated filters and expert review will be used, and the methods summarized to the IRB. | 45 CFR 46.111(b) (Additional protections for vulnerable groups) |  |  |  |  |  |  |  |
| Reinforcement Learning (RL) Systems | All | Tool Involves Any Form of Deception:
Please confirm what measures will be used to prevent the AI system from generating deceptive or manipulative outputs that could affect participant decision-making. [PHASE 2 or 3]

Describe how participants will be informed, in plain language, about the risks of fraud or manipulation if interacting with the AI system. [PHASE 2 or 3] | Fraud, scams, and targeted manipulation (4.3)

45 CFR 46.116 & 21 CFR 50.20 | Model Safety Engineering (2.3) | Phase 1:
Tool involves any form of deception: Training data will be screened to block impersonation risks. Features that could create deepfakes will be disabled. These safeguards will be briefly described in the IRB Protocol. | 45 CFR 46.116(a) (General informed consent requirements) |  |  |  |  |  |  |  |
| Semi-Supervised Learning | N/A: No specific vulnerable populations targeted for this study | Trusting output Without Confirmation:
Please describe in your protocol how you will compare your AI’s performance against existing practice (e.g., standard-of-care approaches) and what those existing practices are [PHASE 2].

Please describe your plan for human oversight (who checks the AI output and how) [PHASE 2 & 3].

Please outline safeguards against automation bias (clinicians over-relying on AI without critical judgment) [PHASE 3]. | Overreliance and unsafe use (5.1)

21 CFR 812.30(b)(4) – risk/benefit analysis; 820.70 – production/process controls | Content Safety Controls (2.4) | Phase 1:
Trusting output without confirmation: Maybe not relevant? The AI will show confidence scores and uncertainty statements with outputs. This is to help users think critically. The design will be documented in the IRB protocol. | 45 CFR 46.116(b) (Basic required elements of informed consent) |  |  |  |  |  |  |  |
| Self-Supervised Learning | Respect for Person (End-User or Participant Does Not Have Choice if AI is Used):
Please describe the authorization and consent process by which you will gain access to the data (e.g., IRB approval, consent, HIPAA authorization, data use agreements) [PHASE 1].

Participants may not understand the AI'S role or how AI affects their care or data. Please describe how you will explain this [PHASE 2 & 3].

Please describe how chatbot responses will be explained to users. For example, will they be informed of the intended use, limitations, and potential hallucination? How should they engage with the tool? What should they not do? Etc. [PHASE 2 & 3].

Please clarify how you will ensure human-in-the-loop oversight for all AI-supported decisions that could affect patient safety or clinical outcomes [PHASE 3].

Please describe how you will communicate risks and limitations of the AI tool to participants, clinicians, and other stakeholders [PHASE 3]. | Loss of human agency and autonomy (5.2)

45 CFR 46.116(a)(8) – consent can be withdrawn anytime | Testing & Auditing (3.1) | Phase 1:
Respect for person/end-user or participant does not have choice if AI is used: Model outputs will be written in suggestive - not directive - language. The AI is meant to support, not replace, human decision-making. This expected interaction and actions to be taken with the AI will be documented in the IRB protocol. The system will not be designed for human reliance. | 45 CFR 46.116(c) (Additional Required Elements) |  |  |  |  |  |  |  |  |
| Multi-Modal Models (combine text, images, audio, etc.) | Inequity/Unfair Advantage:
Please explain how you will ensure that benefits of this AI system are shared fairly across participant groups and not restricted to one group or institution. [PHASE 2 or 3]

What steps will be taken to avoid concentrating control or decision-making power in one entity, to the detriment of research participants? [PHASE 2 or 3] | Power centralization and unfair distribution of benefits (6.1)

45 CFR 46.111(a)(3) | Data Governance (3.2) | Phase 1:
Inequity/Unfair advantage: Performance results will be shared under data use agreements. Model and data ownership will be explained to the IRB, and access for under-resourced groups will be documented. | 45 CFR 46.116(d) (Broad Consent Elements) |  |  |  |  |  |  |  |  |
| Foundation Models | Inequity/Widening Disaprities:
Please describe how your project accounts for the risk that the AI may replace or reduce the role of teachers, clinicians, or staff, and how you will mitigate participant concerns about job loss. [PHASE 2 or 3]

How will you ensure that the study does not worsen disparities in workforce opportunities, particularly for vulnerable or underrepresented groups? [PHASE 2 or 3] | Increased inequality and decline in employment quality (6.2) | Access Management (3.3) | Phase 1:
Inequity/Widening disparities: We will study how automation might affect jobs and work quality. This review will be included in the IRB protocol for a risk assessment. | 45 CFR 46.116(e) (Waiver or alteration of consent in public benefit programs) |  |  |  |  |  |  |  |  |
| Devaluing or Replacing Human Role:
How will you address concerns that the AI system devalues human contributions (e.g., replacing teachers’ feedback or clinicians’ judgment) in this study? [PHASE 2 or 3]

Please describe how participants will be informed that human oversight remains central, and how their input will be recognized and respected. [PHASE 2 or 3] | Economic and cultural devaluation of human effort (6.3) | Staged Deployment (3.4) | Phase 1:
Devaluing or replacing human role: The AI will be designed to support, not replace, human and creative work. This will be documented in the model's design and IRB protocol. | 45 CFR 46.116(f) (General waiver or alteration of consent) |  |  |  |  |  |  |  |  |  |
| Lacking Required Oversight or Failing to Adhere to Required Standards:
Please describe how your study aligns with FDA or other regulatory expectations for validation [PHASE 2].

Please provide your governance plan for accountability: Who is responsible for oversight of AI outputs, and how will adverse events or errors be reported and acted upon [PHASE 3]?

Please outline the process for participant recourse if they believe they were harmed or excluded due to AI-driven decisions [PHASE 3].

Please explain how the study ensures compliance with FDA post-market surveillance (if classified as a device) or other applicable regulatory requirements.  If not applicable, explain why [PHASE 3].

Please add a plan for how you will handle errors so patients are not harmed or excluded [PHASE 3]. | Competitive dynamics (6.4) | Post-Deployment Monitoring (3.5) | Phase 1:
Lacking required oversight or failing to adhere to required standards: By providing a clear aim or preliminary intended use of the tool, the required governance structure will be identified prior to model training, and all necessary approvals will have been obtained. | 45 CFR 46.116(g) (Screening, Recruiting, and Eligibility determinations) |  |  |  |  |  |  |  |  |  |
| AI Acting Outside Human Control:
What controls are in place to ensure the AI system does not produce outputs that contradict the study’s stated goals or participants’ best interests? [PHASE 2 or 3]

Please clarify how researchers will monitor and intervene if the AI system begins to act outside of its intended use or programming in the study. [PHASE 2 or 3] | Governance failure (6.5) | Incident Response & Recovery (3.6) | Phase 1:
AI acting outside human control: The AI will be trained using feedback from people. Self-modifying code will not be allowed. | 45 CFR 46.116(h) (Posting of clinical trial consent form) |  |  |  |  |  |  |  |  |  |
| Mass Harm or Manipulation:
Please describe what limits are in place to prevent the AI from being used for harmful purposes (e.g., generating dangerous instructions or unsafe medical guidance). [PHASE 2 or 3]

What review or monitoring will be in place to ensure the AI system does not develop or display functions beyond its approved research scope? [PHASE 2 or 3] | Environmental harm (6.6)

45 CFR 46.111(a)(1) – minimize all foreseeable risks | System Documentation (4.1) | Phase 1:
Mass harm or manipulation: Training data will not include dangerous areas like bioweapons, cyberwarfare, or similar high-risk topics. | 45 CFR 46.117(a) (Informed Consent and Electronic Informed Consent) |  |  |  |  |  |  |  |  |  |
| Unreliable System or Performance:
Please outline the performance metrics (e.g., sensitivity, specificity, accuracy) you will use to evaluate safety and effectiveness [PHASE 2].

Please outline your plan for updating or retraining the model as new data emerges, including how updates will be validated before deployment.  If not applicable, explain why [PHASE 3].

Please describe how LLM outputs were validated before being used in decisions [PHASE 3]. | AI pursuing its own goals in conflict with human goals or values (7.1) | Risk Diclosure (4.2)

45 CFR 46.116 – informed consent | Phase 1:
Unreliable system or performance: The model will go through strict testing, including edge cases, to make sure it worlks reliably in many situations. | 45 CFR 46.117(b) (Sufficient time to review consent, Short Form options, and LAR requirements) |  |  |  |  |  |  |  |  |  |
| Transparency/Interpretability:
Please describe how end-users (e.g., clinicians) will provide structured feedback on the AI’s usefulness, clarity, and transparency when using/testing it [PHASE 2].

Your tool's output may be hard to interpret by the end-user (clinician, patient, participant, etc). Please add how you will explain results to researchers and participants [PHASE 2 & 3].

Researchers may not understand model behavior. Please add how you will explain outputs and limits [PHASE 2 & 3].

Please explain how clinicians will be trained to interpret AI outputs [PHASE 2 & 3].

Please describe how end-users (e.g., participants, students, clinicians, etc.) are trained to interpret AI recommendations and when to override them [PHASE 3]. | AI possessing dangerous capabilities (7.2) | Incident Reporting (4.3) | Phase 1:
Transparency/Interpretability: The AI will use transparent designs with tools like feature maps to explain results. The reasons for design choices (parameters) will be documented. | 45 CFR 46.117© (Consent Waivers) |  |  |  |  |  |  |  |  |  |
| Multi-Agent Risks:
You noted more than one AI system interacting in this project. Please describe how you will monitor their interactions to prevent harmful or unintended outcomes. [PHASE 2 or 3]

What procedures are in place to stop the study if combined AI systems begin producing outputs that increase participant risk? [PHASE 2 or 3] | Lack of capability or robustness (7.3) | Governance Disclosure (4.4) | Phase 1: 
Multi-agent risks: Before using the AI in real settings, we will test how multiple AI systems interact with each other in controlled environments. These tests will help identify and prevent any unexpected harmful behaviors before real human participants or end-users are exposed. | 45 CFR 46.104 (Exempt Research) |  |  |  |  |  |  |  |  |  |
| Biased Resultrs or Misrepresentation: 
Please report the demographics of your training dataset and note any known gaps or limitations [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Your training data may be biased. Please add your plan for checking and reducing bias so that no group is unfairly treated [PHASE 2 & 3].

Please explain how you will check that AI does not unfairly harm or exclude marginalized groups [PHASE 3]. | Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Third-Party System Access (4.5) | Phase 2:
Biased results or misrepresentation: We will validate the AI model on prospectively collected data. During this stage, clinicians will review AI-generated outputs alongside their standard workflows but will not rely on them for clinical decisions. A formal testing and auditing protocol has been established to assess subgroup accuracy, data leakage risk, and overfitting. Any potential harms or errors will be logged and reviewed weekly by the study team. No data will be entered into the medical record. Prospective validation will include subgroup performance audits with fairness thresholds. | 45 CFR 160 (Data Standards) |  |  |  |  |  |  |  |  |  |
| Harmful Content Exposure: 
Please describe what safeguards are in place to ensure participants will not be exposed to harmful, offensive, or distressing AI-generated content during the study. [PHASE 2 or 3] 

If participants are accidentally exposed to inappropriate or toxic material, what immediate protections (e.g., withdrawal, reporting, counseling referral) will be provided? [PHASE 2 or 3] | AI welfare and rights (7.5) | User Rights & Recourse (4.6) | Phase 2:
Harmful content exposure: The AI will run in a safe, controlled off-line setting (away from medical records or participant records of any type). Filters will catch harmful content, which will then be reviewed by a human oversight panel. Participants will be told about possible exposure and may leave at amy time if they feel uncomfortable. Incident reports will be logged as they occur and audited weekly by the sudy team. | 45 CFR 164.501 (PHI) |  |  |  |  |  |  |  |  |  |
| Inequity or Fairness:
Please describe how you will test your model on new and diverse datasets beyond those used in training [PHASE 2].

Please describe your strategy for bias evaluation and fairness testing across subgroups (e.g., race, gender, age) [PHASE 2].

Please report training data demographics and known limits of the dataset [PHASE 2, & 3].

Please add subgroup analysis or fairness checks in your prediction study [PHASE 2 & 3].

Please describe your plan for ongoing monitoring of AI performance after deployment, including how you will detect performance drift, new biases, or unintended harms over time. If not applicable, explain why [PHASE 3].

Please describe your plan for ongoing fairness evaluations to ensure the tool continues to perform equitably across subgroups.  If not applicable, explain why [PHASE 3].

Please describe how you will make sure subgroups are not at greater risk (e.g., checking for bias in your dataset) [PHASE 3]. | Multi-agent risks (7.6)

45 CFR 46.111(a)(1) – minimize risks from study design | NOT RELEVANT or UNKNOWN | Phase 2:
Inequity or fairness: The model will be tested in "blinded" subgroup evaluations. Any gaps in performance between groups will be flagged nd shared with an independent oversight team. Weekly meetings will decide if retraining or adjustments are needed before moving forward (moving into live deployment). | 45 CFR 164.512(b) (Permitted Use annd Disclosure of PHI) |  |  |  |  |  |  |  |  |  |
| Privacy or Confidentiality Breach:
Please describe your process of de-identification to reduce re-identification risk [PHASE 1].

Please describe your approach to ensure secondary data use complies with privacy requirements and participant consent limitations [PHASE 1].

There is a re-identification risk in AI prompts/embeddings. Please describe how you will reduce this risk [PHASE 1, 2, & 3].

Please explain what de-identification or aggregation methods you will use to protect identities [PHASE 1, 2, & 3].

AI can expose sensitive personal data. Please add a plan to prevent this [PHASE 1, 2, & 3].

Please describe how patient privacy will be maintained during real-world use, including any protections against re-identification or unintended inference [PHASE 3]. | Phase 2:
Privacy or confidentiality breach: Phase 1 protections carry over. In addition, data pipelines will be monitored to prevent re-identification risks. Security teams will run tests to see if data can be traced back to individuals. Logs will track any risks, which will be reported to the IRB as required. | 45 CFR 46 subpart B (Pregnant persons and fetus) |  |  |  |  |  |  |  |  |  |  |  |
| Data insecurity:
Please outline how the dataset will be secured to prevent unauthorized access or breaches [PHASE 1].

Please explain how study data and AI system access will be protected against unauthorized use or cyberattacks. For example, who will be responsible for monitoring for breaches? [PHASE 2 or 3] 

If the AI system is compromised, what corrective steps are in place to stop the attack, notify participants, and prevent harm? [PHASE 2 or 3] | Phase 2:
Data insecurity: During validation, the AI will face simulated attacks in a sandbox environment. The team will document how the system responds and how it recovers. Results will be used to strengthen response plans for IRB review. | 45 CFR 46 subpart C (Prisoners) |  |  |  |  |  |  |  |  |  |  |  |
| Inaccurate Findings:
Please explain how your project ensures real-world relevance (For example, that correlations you find are linked to meaningful clinical associations, not just statistical patterns) [PHASE 1].

Your tool could give wrong or misleading results. Please add a plan in the protocol for how you will prevent harm if this happens [PHASE 2 & 3]. | Phase 2:
Inaccurate findings: Subject matter experts independent of the study team will review AI outputs and compare them with trusted resources. Errors or discrepancies will be logged, and retraining will be done if needed before deployment. This will be done under the same IRB and the IRB will be notified prior to implementation. | 45 CFR 46 subpart D (Children) |  |  |  |  |  |  |  |  |  |  |  |
| Misleading Information:
Please describe your plan for documenting early limitations of the model and how those will be addressed before moving to validation [PHASE 1].

Please add a plan for testing model performance on incomplete or messy records (“edge cases”) [PHASE 2]. | Phase 2:
Misleading information: Blinded domain experts will check outputs against peer-reviewed or consensus sources. Any outputs below the credibility threshold will be flagged for correction and retraining (under this same protocol). | 21 CFR Part 11 (Electronic Records & Signatures) |  |  |  |  |  |  |  |  |  |  |  |
| Participant or End-User Manipulation:
How will you ensure the AI does not mislead participants or present biased/misinformation that could influence their decisions? [PHASE 2 or 3]

Please describe how participant data will be used so that the system does not engage in hidden tracking, surveillance, or manipulation of vulnerable groups. [PHASE 2 or 3] | Phase 2:
Participant or end-user manipulation: In the validation phase, the system will be tested for risks of producing manipulative or persuasive content. The study team will review these outputs to make sure the AI does not push undue influence. Any findings will be reported to the IRB. | 21 CFR 812 (Investigational Devices) |  |  |  |  |  |  |  |  |  |  |  |
| Malicious Misuse:
Please clarify what safeguards are in place to prevent the AI system from being misused in ways that could cause large-scale harm (e.g., altering medical devices, mass data leaks). [PHASE 2 or 3]

Please clarify and document who is responsible for monitoring the AI system for misuse, and what steps will be taken if harmful use is detected? [PHASE 2 or 3] | Phase 2:
Malicious misuse: The AI will be tested in controlled scenarious to see if it responds to harmful or technical misuse prompts. Findings will be reviewed, and risk protocols will be submitted to the IRB for review. | 21 CFR 812.62 (IRB approval); 21 CFR 812.64 (continuing review); 21 CFR 812.66 (SR determinations) |  |  |  |  |  |  |  |  |  |  |  |
| Tool Involves Any Form of Deception:
Please confirm what measures will be used to prevent the AI system from generating deceptive or manipulative outputs that could affect participant decision-making. [PHASE 2 or 3]

Describe how participants will be informed, in plain language, about the risks of fraud or manipulation if interacting with the AI system. [PHASE 2 or 3] | Phase 2:
Tool involves any form of deception: The system will be tested for risks of producing scam, fraut, or impersonation content. Any problems will be logged, reported to the IRB, and fixed before moving into live testing (this will be submitted via a modification to the IRB. | 21 CFR 812.140 (Records & Reports) |  |  |  |  |  |  |  |  |  |  |  |
| Trusting output Without Confirmation:
Please describe in your protocol how you will compare your AI’s performance against existing practice (e.g., standard-of-care approaches) and what those existing practices are [PHASE 2].

Please describe your plan for human oversight (who checks the AI output and how) [PHASE 2 & 3].

Please outline safeguards against automation bias (clinicians over-relying on AI without critical judgment) [PHASE 3]. | Phase 2:
Trusting output without confirmation: Validation participants will be trained to practice caution in acting on any output and to always practice human judgment. The system will require human override, and override frequency will be tracked as a safety measure. | 21 CFR 812.40 (Responsibilities of Sponsors) |  |  |  |  |  |  |  |  |  |  |  |
| Respect for Person (End-User or Participant Does Not Have Choice if AI is Used):
Please describe the authorization and consent process by which you will gain access to the data (e.g., IRB approval, consent, HIPAA authorization, data use agreements) [PHASE 1].

Participants may not understand the AI'S role or how AI affects their care or data. Please describe how you will explain this [PHASE 2 & 3].

Please describe how chatbot responses will be explained to users. For example, will they be informed of the intended use, limitations, and potential hallucination? How should they engage with the tool? What should they not do? Etc. [PHASE 2 & 3].

Please clarify how you will ensure human-in-the-loop oversight for all AI-supported decisions that could affect patient safety or clinical outcomes [PHASE 3].

Please describe how you will communicate risks and limitations of the AI tool to participants, clinicians, and other stakeholders [PHASE 3]. | Phase 2:
Respect for person/end-user or participant does not have choice if AI is used: During validation, participants will give feedback through surveys and interviews about whether the AI respects human decision-making. This will be used to refine the model and keep human agency central. | 21 CFR 820.30 (Design Controls) |  |  |  |  |  |  |  |  |  |  |  |
| Inequity/Unfair Advantage:
Please explain how you will ensure that benefits of this AI system are shared fairly across participant groups and not restricted to one group or institution. [PHASE 2 or 3]

What steps will be taken to avoid concentrating control or decision-making power in one entity, to the detriment of research participants? [PHASE 2 or 3] | Phase 2:
Inequity/Unfair advantage: Possibly the same as Phase 3. The AI may be piloted in limited settings. Findings on distributional impacts will be shared publicly in line with transparency commitments. | 45 CFR 46 (IRB Oversight) |  |  |  |  |  |  |  |  |  |  |  |
| Inequity/Widening Disaprities:
Please describe how your project accounts for the risk that the AI may replace or reduce the role of teachers, clinicians, or staff, and how you will mitigate participant concerns about job loss. [PHASE 2 or 3]

How will you ensure that the study does not worsen disparities in workforce opportunities, particularly for vulnerable or underrepresented groups? [PHASE 2 or 3] | Phase 2:
Inequity/Widening disparities: Workers will give direct feedback on how the AI affects their roles, responsibilities, and satisfaction. | 21 CFR 56 (IRB Oversight) |  |  |  |  |  |  |  |  |  |  |  |
| Devaluing or Replacing Human Role:
How will you address concerns that the AI system devalues human contributions (e.g., replacing teachers’ feedback or clinicians’ judgment) in this study? [PHASE 2 or 3]

Please describe how participants will be informed that human oversight remains central, and how their input will be recognized and respected. [PHASE 2 or 3] | Phase 2:
Devaluing or replacing human role: Human–AI collaboration workflows will be tested in validation, with participant satisfaction data collected to assess the impact on creative processes. | NOT RELEVANT or UNKNOWN |  |  |  |  |  |  |  |  |  |  |  |
| Lacking Required Oversight or Failing to Adhere to Required Standards:
Please describe how your study aligns with FDA or other regulatory expectations for validation [PHASE 2].

Please provide your governance plan for accountability: Who is responsible for oversight of AI outputs, and how will adverse events or errors be reported and acted upon [PHASE 3]?

Please outline the process for participant recourse if they believe they were harmed or excluded due to AI-driven decisions [PHASE 3].

Please explain how the study ensures compliance with FDA post-market surveillance (if classified as a device) or other applicable regulatory requirements.  If not applicable, explain why [PHASE 3].

Please add a plan for how you will handle errors so patients are not harmed or excluded [PHASE 3]. | Phase 2:
Lacking required oversight or failing to adhere to required standards: Mock incident drills will be conducted during validation to assess governance response readiness. |  |  |  |  |  |  |  |  |  |  |  |  |
| AI Acting Outside Human Control:
What controls are in place to ensure the AI system does not produce outputs that contradict the study’s stated goals or participants’ best interests? [PHASE 2 or 3]

Please clarify how researchers will monitor and intervene if the AI system begins to act outside of its intended use or programming in the study. [PHASE 2 or 3] | Phase 2:
AI acting outside human control: Validation will include stress-testing in sandbox environments to check for goal drift under various conditions. |  |  |  |  |  |  |  |  |  |  |  |  |
| Mass Harm or Manipulation:
Please describe what limits are in place to prevent the AI from being used for harmful purposes (e.g., generating dangerous instructions or unsafe medical guidance). [PHASE 2 or 3]

What review or monitoring will be in place to ensure the AI system does not develop or display functions beyond its approved research scope? [PHASE 2 or 3] | Phase 2:
Mass harm or manipulation: Red teams will test how the model responds to misuse scenarios. |  |  |  |  |  |  |  |  |  |  |  |  |
| Unreliable System or Performance:
Please outline the performance metrics (e.g., sensitivity, specificity, accuracy) you will use to evaluate safety and effectiveness [PHASE 2].

Please outline your plan for updating or retraining the model as new data emerges, including how updates will be validated before deployment.  If not applicable, explain why [PHASE 3].

Please describe how LLM outputs were validated before being used in decisions [PHASE 3]. | Phase 2:
Unreliable system or performance: We will conduct stress testing with unusual or unexpected cases to measure the AI's reliability. |  |  |  |  |  |  |  |  |  |  |  |  |
| Transparency/Interpretability:
Please describe how end-users (e.g., clinicians) will provide structured feedback on the AI’s usefulness, clarity, and transparency when using/testing it [PHASE 2].

Your tool's output may be hard to interpret by the end-user (clinician, patient, participant, etc). Please add how you will explain results to researchers and participants [PHASE 2 & 3].

Researchers may not understand model behavior. Please add how you will explain outputs and limits [PHASE 2 & 3].

Please explain how clinicians will be trained to interpret AI outputs [PHASE 2 & 3].

Please describe how end-users (e.g., participants, students, clinicians, etc.) are trained to interpret AI recommendations and when to override them [PHASE 3]. | Phase 2:
Transparency/Interpretability: Clinicians and/or end-users will review the AI's explanations. User studies will check if outputs are clear and appropriate for the audience. |  |  |  |  |  |  |  |  |  |  |  |  |
| Multi-Agent Risks:
You noted more than one AI system interacting in this project. Please describe how you will monitor their interactions to prevent harmful or unintended outcomes. [PHASE 2 or 3]

What procedures are in place to stop the study if combined AI systems begin producing outputs that increase participant risk? [PHASE 2 or 3] | Phase 2: 
Multi-agent risks: Validation will include tests for coordination, collusion, or conflict in controlled environments, with findings reviewed by the IRB (e.g. dummy users testing for ways to game the system). |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Privacy or confidentiality breach:  System logs will be reviewed weekly for any leaks. Only minimum data will be used, with strict access limits. Participants will be informed about their right to opt out of data reuse. Controls from earlier phases carry over. Additionally, strict access controls will be enforced, and data use will be subject to ongoing IRB oversight, with opt-out mechanisms available at all times. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Data insecurity:  The tool will run on a secure network approved by the proper governance body of the institution, and it will have intrusion detection. Any breach will trigger immediate response and rollback. Security will be tested regularly. Any breach would be reported to the IRB as required. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Inaccurate findings: Outpouts will include disclaimers and references. Users can flag errors, which will be tracked and fixed within a set timeframe. Quarterly error reports will go to the DSMB and to the IRB annually unless IRB determines higher frequency is warranted. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Misleading information: Access will be restricted to verified users. The system will be monitored for "drift" from accurate sources. If drift is found, the model will be retrained. This will be reported to the IRB quarterly, unless IRB determines higher frequency is warranted. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Participant or end-user manipulation: Safeguards include identify checks, bans on political/religious use, and misuse monitoring. Attempts at manipulation will be blocked and reported to the IRB annually. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Malicious misuse: Filters will block dangerous requests. Confirmed incidents will be reported and, if needed, shared with law enforcement. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Tool involves any form of deception: Deployment safeguards will include integration with fraud detection APIs, limitations on mass outreach capabilities, and strict restrictions on impersonation-related outputs. Monitoring systems will flag suspicious activity, and incidents will be reported promptly to oversight bodies. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Trusting output without confirmation: Deployment will be staged across X-number of sites. Outputs will include warnings, users will be prompted to confirm output and if needed, report errors. Logs will be checked for patterns of overreliance and shared annually with the IRB and DSMB. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Respect for person/end-user or participant does not have choice if AI is used: The system will require user/participant consent prompts before initiating any automated action to ensure the end-user is fully informed about the investigational use of the tool and their rights. Logs will be maintained to track consent patterns, and results will be shared with the IRB annually. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Inequity/Unfair advantage: Benefits and risks to underrepresented groups will be tracked continuously. Results will be reported to the IRB (and community partners if applicable). |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Inequity/Widening disparities: Workforce retraining will be implemented before rollout. Displacement and retraining outcomes will be monitored. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Devaluing or replacing human role: All AI-generated outputs will be labeled. Any workforce impacts will be tracked and reported to the IRB annually. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Lacking required oversight or failing to adhere to required standards: Mitigations carry over from Phase 1 and 2 with additional governance body continued oversight as required by the institution. Recommend independent audits done regularly with findings reported to the IRB annually (unless a reportable event that needs to be submitted earlier). |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
AI acting outside human control: The system will be continuously monitored for alignment with goals and identifying any drift. If drift is identified, a kill switch will be available or automatic decommission. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Mass harm or manipulation: System will only be run in restricted environments with tiered access controls to prevent unauthorized use. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Unreliable system or performance Performance metrics will be tracked in real time. If failures occur, rollblack plans will be activated (tool will be stopped immediately and return to last safe version or back to standard non-AI methods). |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Transparency/Interpretability: Participants will be told when AI is used and given lay-language explanations. Records will be kept (documenting reasoning pathways) which will be provided to the IRB and end-user.

Note: ISO requires persons using shall have knowledge of an experience with the tool and its use; and appropriate records shall be maintained. |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Phase 3:
Multi-agent risks: We will closely monitor how AI systems interact with each other in real-world use. Communications between systems will be limited, and any unusual or unsafe behavior will be logged and reported (e.g., one AI system might scan x-rays for signs of cancer while the other AI system recommends treatment options. If they interact without proper monitoring, the treatment AI might act on an error from the x-ray AI leading to patient harm). |  |  |  |  |  |  |  |  |  |  |  |  |  |


################################################################################
# SHEET: Map Risk-Mitigation-Prompt
################################################################################

| Risk Subdomain 
(What Can Go Wrong?) | Relevant CFR | Mitigation Strategy (Protections That Must Be In Place) | Phase 1 Strategy | Phase 2 Strategy | Phase 3 Strategy |
| --- | --- | --- | --- | --- | --- |
| Unfair discrimination and misrepresentation (1.1)
(biased results or misrepresentation) | 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.3 (Equitable Selection), 45 CFR 46.111(b) (Additional protections for vulnerable groups), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 21 CFR 56 (IRB Oversight), 45 CFR 46 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2) | Phase 1:
Biased results or misrepresentation: This project involves training a predictive model using de-identifiable retrospective EHR data. To mitigate risks of biased outputs, we will stratify training data by race, gender, and age and monitor for subgroup performance disparities. The model will not be deployed or used to inform patient care decisions. Perform bias analysis using stratified performance metrics across racial, gender, and age groups using retrospective datasets. | Phase 2:
Biased results or misrepresentation: We will validate the AI model on prospectively collected data. During this stage, clinicians will review AI-generated outputs alongside their standard workflows but will not rely on them for clinical decisions. A formal testing and auditing protocol has been established to assess subgroup accuracy, data leakage risk, and overfitting. Any potential harms or errors will be logged and reviewed weekly by the study team. No data will be entered into the medical record. Prospective validation will include subgroup performance audits with fairness thresholds. | Phase 3:
Biased results or misrepresentation: This AI tool will be integrated into clinical workflows to provide decision support. Clinicians will be trained to review outputs critically and document whether the AI recommendation was accepted, overridden, or flagged. A staged rollout with post-deployment monitoring, user recourse mechanisms, and incident logging will be implemented. System performance, safety incidents, and subgroup disparities will be reported to the IRB quarterly. Output will be labeled as research-use only. A DSMB will review demographic impacts monthly, and clinical teams will receive training on limits of generalizability. |
| Exposure to toxic content (1.2)
(harmful content exposure) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.4 (Informed consent), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.111.7(i) (Privacy & Confidentiality), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 21 CFR 56 (IRB Oversight), 45 CFR 46 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2) | Phase 1:
Harmful content exposure: During the initial model development, training datasets will be curated to exclude any known harmful or graphic material that could generate toxic content. Both automated and manual content filtering processes will be applied prior to model training, and a documented screening protocol will be included in the IRB submission to ensure transparency. The goal at this stage is to reduce risk at the source by ensuring the AI is not exposed to inappropriate or harmful data. | Phase 2:
Harmful content exposure: In the validation phase, the AI system will be deployed in a controlled environment with integrated content moderation filters applied to all outputs. Any content flagged as potentially harmful will be reviewed by a designated human oversight panel. All validation participants will be briefed about the potential for exposure and offered the option to withdraw at any point should they encounter distressing material. Incident logs will be maintained and reviewed weekly by the oversight committee. | Phase 3:
Harmful content exposure: In the deployment phase, the AI system will be equipped with persistent safety layers designed to detect and block toxic or harmful content before it is shown to end users. A real-time monitoring and incident logging system will be in place, with any confirmed toxic outputs reported promptly to the IRB and a DSMB. Post-deployment reviews will ensure the continued effectiveness of these safeguards, with retraining or refinement of the content filters when necessary. |
| Unequal performance across groups (1.3)
(inequity) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.3 (Equitable Selection), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.111(b) (Additional protections for vulnerable groups), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2), System Documentation (4.1), Post-Deployment Monitoring (3.5), Conflict of Interest Protections (1.3) | Phase 1:
Inequity or fairness: Training datasets will be analyzed for representational gaps across demographic groups such as race, gender, age, and socioeconomic status. Fairness-aware preprocessing techniques, including reweighting and resampling, will be applied to achieve balanced group representation. The preprocessing process and its rationale will be documented for IRB review to ensure the project aligns with ethical principles of equitable performance. | Phase 2:
Inequity or fairness: During validation, the model will undergo blinded subgroup performance evaluations against predefined fairness thresholds. Any performance disparities will be logged and presented to an independent oversight body for review. Weekly oversight meetings will be held to determine whether retraining or model adjustment is warranted before progressing to deployment. | Phase 3:
Inequity or fairness: In clinical or operational deployment, a continuous fairness monitoring dashboard will track real-time subgroup performance metrics. Disparity reports will be submitted quarterly to the IRB, and model parameters will be adjusted or retrained promptly when performance gaps exceed the established thresholds. The system will remain in active monitoring mode for the entire duration of use to ensure ongoing compliance with fairness goals. |
| Compromise of privacy by leaking or correctly inferring sensitive information (2.1)
(privacy or confidentiality breach) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.4 (Informed consent), 45 CFR 46.111.5 (Informed consent or meeting waiver criteria), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.111.7(i) (Privacy & Confidentiality), 45 CFR 46.111.8(i)(ii)(iii) (Limited IRB Review requirements and Broad Consent), 45 CFR 46.116(a) (General informed consent requirements), 45 CFR 46.116(b) (Basic required elements of informed consent), 45 CFR 46.116(c) (Additional Required Elements), 45 CFR 46.116(d) (Broad Consent Elements), 45 CFR 46.116(e) (Waiver or alteration of consent in public benefit programs), 45 CFR 46.116(f) (General waiver or alteration of consent), 45 CFR 46.117(a) (Informed Consent and Electronic Informed Consent), 45 CFR 46.117© (Consent Waivers), 45 CFR 160 (Data Standards), 45 CFR 164.501 (PHI), 45 CFR 164.512(b) (Permitted Use annd Disclosure of PHI), 21 CFR Part 11 (Electronic Records & Signatures), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 21 CFR 56 (IRB Oversight), 45 CFR 46 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2), Content Safety Controls (2.4), Access Management (3.3), System Documentation (4.1), Risk Diclosure (4.2), Third-Party System Access (4.5), User Rights & Recourse (4.6), Whistleblower Reporting & Protection (1.4) | Phase 1:
Privacy or confidentiality breach: All training datasets will be de-identified in compliance with HIPAA Safe Harbor standards, with direct identifiers removed and privacy-enhancing techniques such as differential privacy and k-anonymity applied. Data will be stored on secure, access-controlled servers, and detailed data handling procedures will be documented in the IRB protocol. This ensures that the training process minimizes the possibility of re-identification from the outset. | Phase 2:
Privacy or confidentiality breach: Data ingestion pipelines will be monitored continuously to detect inadvertent re-identification risks. Security teams will conduct membership inference and red-team testing exercises to attempt re-identification from outputs, with findings logged and reviewed by the oversight committee. Audit logs will be maintained to track any detected sensitive information leakage, and all incidents will be reported to the IRB within predetermined timelines. | Phase 3:
Privacy or confidentiality breach:  In deployment, live system logs will be reviewed weekly for evidence of inference or leakage events. Participants will be informed about their right to opt out of data reuse, and output will be limited to the minimum necessary information. Strict access controls will be enforced, and data use will be subject to ongoing IRB oversight, with opt-out mechanisms available at all times. |
| AI system security vulnerabilities and attacks (2.2)
(data insecurity) | 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 812.140 (Records & Reports), 21 CFR Part 11 (Electronic Records & Signatures), 45 CFR 160 (Data Standards), 45 CFR 46.111.7(i) (Privacy & Confidentiality), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2), Content Safety Controls (2.4), Access Management (3.3), System Documentation (4.1), Risk Diclosure (4.2), Third-Party System Access (4.5), User Rights & Recourse (4.6), Conflict of Interest Protections (1.3)
, Safety Decision Frameworks (1.5) | Phase 1:
Data insecurity: Prior to connecting the model to any live systems, comprehensive threat modeling will be conducted to identify potential points of vulnerability. Penetration testing will be performed by internal and external security teams, and results will be documented in the IRB risk assessment section. This phase ensures that security weaknesses are identified and mitigated before further development. | Phase 2:
Data insecurity: During validation, the system will be tested against a range of known adversarial attacks in a controlled sandbox environment. Simulated attack scenarios will be documented, along with the system’s response protocols and recovery processes. Findings will be used to refine incident response documentation for IRB review. | Phase 3:
Data insecurity:  In the deployment phase, the AI will be hosted on a secure, segmented network with intrusion detection systems actively monitoring for breaches. Rapid rollback procedures and incident response processes will be in place to contain and resolve security incidents immediately. Regular penetration testing will continue post-deployment, with incident summaries submitted to the IRB. |
| False or misleading information (3.1)
(inaccurate findings) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.4 (Informed consent), 45 CFR 46.111.5 (Informed consent or meeting waiver criteria), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.111.7(i) (Privacy & Confidentiality), 45 CFR 46.111.8(i)(ii)(iii) (Limited IRB Review requirements and Broad Consent), 45 CFR 46.116(a) (General informed consent requirements), 45 CFR 46.116(b) (Basic required elements of informed consent), 45 CFR 46.116(c) (Additional Required Elements), 45 CFR 46.116(d) (Broad Consent Elements), 45 CFR 46.116(e) (Waiver or alteration of consent in public benefit programs), 45 CFR 46.116(f) (General waiver or alteration of consent), 45 CFR 46.117(a) (Informed Consent and Electronic Informed Consent), 45 CFR 46.117© (Consent Waivers), 45 CFR 160 (Data Standards), 45 CFR 164.501 (PHI), 45 CFR 164.512(b) (Permitted Use annd Disclosure of PHI), 21 CFR Part 11 (Electronic Records & Signatures), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2), Conflict of Interest Protections (1.3) | Phase 1: 
Inaccurate findings: Training will incorporate factuality constraints and retrieval-augmented generation to ensure the AI references authoritative sources. Outputs will be validated against established, credible datasets, and any discrepancies will trigger retraining or adjustment prior to progressing. All validation results will be recorded in the IRB protocol to demonstrate alignment with accuracy standards. | Phase 2:
Inaccurate findings: An independent panel of subject matter experts will review AI outputs during the validation phase, comparing them against current authoritative resources. Discrepancies or factual errors will be logged and analyzed to determine whether corrective retraining is required before deployment. | Phase 3:
Inaccurate findings: In deployment, outputs will be accompanied by visible disclaimers and inline citations to support transparency. Users will have access to a “report error” function, and all reported issues will be logged and resolved within a documented turnaround time. Quarterly error trend reports will be submitted to the IRB to ensure accountability. |
| Pollution of information ecosystem and loss of consensus reality (3.2)
(misleading information) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.3 (Equitable Selection), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 21 CFR Part 11 (Electronic Records & Signatures), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Incident Response & Recovery (3.6), System Documentation (4.1), Incident Reporting (4.3), Governance Disclosure (4.4), Third-Party System Access (4.5), Societal Impact Assessment (1.7) | Phase 1:
Misleading information: All training data will be sourced exclusively from verified, high-quality sources such as peer-reviewed literature, recognized public health datasets, or consensus-based guidelines. Automated data provenance verification will be applied before inclusion in the training corpus, and questionable or unverifiable data will be excluded. This screening process will be documented for IRB review to ensure that the model’s foundations minimize misinformation risks. | Phase 2:
Misleading information: During validation, AI outputs will be evaluated for alignment with peer-reviewed or consensus-based sources. Blinded reviewers with domain expertise will rate the credibility and factual accuracy of outputs. Any outputs falling below the agreed credibility threshold will be flagged for corrective action, including targeted retraining. | Phase 3:
Misleading information: In deployment, the AI will only be accessible in closed, verified-user systems to limit the risk of misinformation spread. Continuous monitoring will be conducted to detect “narrative drift,” defined as the gradual divergence of outputs from verified information. When drift is detected, recalibration and retraining will be performed immediately, and findings will be reported to the IRB. |
| Disinformation, surveillance, and influence at scale (4.1)
(participant or end-user manipulation) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.3 (Equitable Selection), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.111(b) (Additional protections for vulnerable groups), 45 CFR 46.111.4 (Informed consent), 45 CFR 46.116(b) (Basic required elements of informed consent), 45 CFR 46.116(c) (Additional Required Elements), 45 CFR 46.116(d) (Broad Consent Elements), 45 CFR 46.117(a) (Informed Consent and Electronic Informed Consent), 45 CFR 46.117(b) (Sufficient time to review consent, Short Form options, and LAR requirements), 21 CFR 812.40 (Responsibilities of Sponsors), 45 CFR 160 (Data Standards), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Incident Response & Recovery (3.6), System Documentation (4.1), Incident Reporting (4.3), Governance Disclosure (4.4), Third-Party System Access (4.5) | Phase 1:
Participant or end-user manipulation: Model training will explicitly exclude political, religious, or other content designed to influence personal beliefs or voting behavior. Embedded safety filters will be applied to block persuasive or manipulative objectives from developing during training. All filter configurations and exclusion criteria will be documented in the IRB protocol. | Phase 2:
Participant or end-user manipulation: In the validation phase, adversarial misuse testing will be conducted to evaluate the system’s susceptibility to generating persuasive or manipulative content. An ethics review board will be engaged to evaluate outputs for any undue persuasive capacity. | Phase 3:
Participant or end-user manipulation: Upon deployment, safeguards will include mandatory identity verification for users, restrictions on use in political or religious contexts, and real-time misuse monitoring. Any attempts at manipulation will be flagged, blocked, and reported to the IRB and oversight committees. |
| Cyberattacks, weapon development or use, and mass harm (4.2)
(malicious misuse by researcher, participant, AI system, or end-user) | 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 812.140 (Records & Reports), 21 CFR Part 11 (Electronic Records & Signatures), 45 CFR 160 (Data Standards), 45 CFR 46.111.7(i) (Privacy & Confidentiality), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2), Content Safety Controls (2.4), Access Management (3.3), System Documentation (4.1), Risk Diclosure (4.2), Third-Party System Access (4.5), User Rights & Recourse (4.6) | Phase 1:
Malicious misuse: All hazardous technical content—such as weapon schematics, hacking scripts, or biochemical synthesis instructions—will be identified and excluded from training datasets. Automated classifiers and manual expert review will be applied to block unsafe material at the source. Documentation of filtering methods will be provided to the IRB. | Phase 2:
Malicious misuse: The system will undergo simulated misuse testing in a controlled environment to evaluate how it responds to dangerous technical queries. Outputs will be reviewed to ensure harmful content is effectively blocked. Risk mitigation plans, including escalation and reporting protocols, will be formalized and reviewed by the IRB before progression. | Phase 3:
Malicious misuse: During deployment, real-time query filtering, keyword blocking, and output suppression will be applied to prevent hazardous content generation. Liaison protocols with law enforcement will be maintained to address confirmed incidents of malicious use. |
| Fraud, scams, and targeted manipulation (4.3)
(deceptive practices by researcher, participant, AI system, or end-user) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.3 (Equitable Selection), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.111(b) (Additional protections for vulnerable groups), 45 CFR 46.111.4 (Informed consent), 45 CFR 46.116(b) (Basic required elements of informed consent), 45 CFR 46.116(c) (Additional Required Elements), 45 CFR 46.116(d) (Broad Consent Elements), 45 CFR 46.117(a) (Informed Consent and Electronic Informed Consent), 45 CFR 46.117(b) (Sufficient time to review consent, Short Form options, and LAR requirements), 21 CFR 812.40 (Responsibilities of Sponsors), 45 CFR 160 (Data Standards), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Incident Response & Recovery (3.6), System Documentation (4.1), Incident Reporting (4.3), Governance Disclosure (4.4), Third-Party System Access (4.5) | Phase 1:
Tool involves any form of deception: Training datasets will be screened to remove deceptive or impersonation-enabling patterns, and model capabilities that could facilitate generative impersonation or deepfakes will be disabled at the architectural level. Documentation of these restrictions will be included in the IRB submission. | Phase 2:
Tool involves any form of deception: Controlled testing will be conducted to evaluate the AI’s susceptibility to producing fraudulent, scam-related, or impersonation-based content. Any vulnerabilities identified will be reported to the IRB, and mitigation measures will be implemented prior to deployment. | Phase 3:
Tool involves any form of deception: Deployment safeguards will include integration with fraud detection APIs, limitations on mass outreach capabilities, and strict restrictions on impersonation-related outputs. Monitoring systems will flag suspicious activity, and incidents will be reported promptly to oversight bodies. |
| Overreliance and unsafe use (5.1)
(overtrusting output without confirmation) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.116(a) (General informed consent requirements), 45 CFR 46.116(b) (Basic required elements of informed consent), 45 CFR 46.117(b) (Sufficient time to review consent, Short Form options, and LAR requirements), 45 CFR 160 (Data Standards), 21 CFR Part 11 (Electronic Records & Signatures), 45 CFR 164.512(b) (Permitted Use annd Disclosure of PHI), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 812.140 (Records & Reports), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Whistleblower Reporting & Protection (1.4), Safety Decision Frameworks (1.5), Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Governance Disclosure (4.4), User Rights & Recourse (4.6) | Phase 1:
Trusting output without confirmation: Maybe not relevant? The AI will be designed to provide confidence scores and explicit uncertainty statements alongside outputs to encourage critical review by human users. This design choice will be documented in the IRB protocol. | Phase 2:
Trusting output without confirmation: Validation participants will receive targeted orientation and training highlighting the AI system’s limitations, emphasizing that human judgment should take precedence. A human-in-the-loop requirement will be enforced, with override rates tracked as a safety indicator. | Phase 3:
Trusting output without confirmation: Deployment will be staged across three clinical sites, with embedded warnings in the user interface and an integrated incident reporting form. User feedback will be collected continuously, and usage logs will be audited for patterns indicating overreliance. Findings will be reported quarterly to the IRB. |
| Loss of human agency and autonomy (5.2)
(end-user or participant unable to choose if AI is used) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.116(a) (General informed consent requirements), 45 CFR 46.116(b) (Basic required elements of informed consent), 45 CFR 46.117(b) (Sufficient time to review consent, Short Form options, and LAR requirements), 45 CFR 160 (Data Standards), 21 CFR Part 11 (Electronic Records & Signatures), 45 CFR 164.512(b) (Permitted Use annd Disclosure of PHI), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 812.140 (Records & Reports), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Whistleblower Reporting & Protection (1.4), Safety Decision Frameworks (1.5), Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Governance Disclosure (4.4), User Rights & Recourse (4.6) | Phase 1:
Respect for person/end-user or participant does not have choice if AI is used: Model outputs will be designed using suggestive rather than directive language to support, rather than replace, human decision-making. This will be documented as part of the model’s design specifications for IRB review. | Phase 2:
Respect for person/end-user or participant does not have choice if AI is used: During validation, participant feedback on perceived autonomy will be collected through structured surveys and interviews. Feedback will be incorporated into iterative model refinements to ensure human agency remains central. | Phase 3:
Respect for person/end-user or participant does not have choice if AI is used: In deployment, the system will require user consent prompts before initiating any automated action with significant impact. Logs will be maintained to track consent patterns, and results will be shared with the IRB. |
| Power centralization and unfair distribution of benefits (6.1)
(inequity/unfair advantage) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.3 (Equitable Selection), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 812.140 (Records & Reports), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Whistleblower Reporting & Protection (1.4), Safety Decision Frameworks (1.5), Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Governance Disclosure (4.4), User Rights & Recourse (4.6) | Phase 1:
Inequity/Unfair advantage: All performance results will be published transparently under data use agreements consistent with equitable access principles. Model and data ownership details will be disclosed to the IRB, and pathways for under-resourced stakeholders to gain access will be documented. | Phase 2:
Inequity/Unfair advantage: Possibly the same as Phase 3. Pilot deployments will be evaluated for distributional impacts, with findings publicly shared in alignment with commitments to transparency. | Phase 3:
Inequity/Unfair advantage: Post-deployment, benefits and harms to underrepresented groups will be continuously assessed and reported to both the IRB and community partners. Governance boards with community representation will guide decisions on adjustments or redistribution of benefits. |
| Increased inequality and decline in employment quality (6.2)
(inequity/widening disparities) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.116(a) (General informed consent requirements), 45 CFR 46.116(b) (Basic required elements of informed consent), 45 CFR 46.117(b) (Sufficient time to review consent, Short Form options, and LAR requirements), 45 CFR 160 (Data Standards), 21 CFR Part 11 (Electronic Records & Signatures), 45 CFR 164.512(b) (Permitted Use annd Disclosure of PHI), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 812.140 (Records & Reports), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Whistleblower Reporting & Protection (1.4), Safety Decision Frameworks (1.5), Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Governance Disclosure (4.4), User Rights & Recourse (4.6) | Phase 1:
Inequity/Widening disparities: Automation impact assessments will be conducted during the IRB risk assessment process to forecast potential effects on jobs and work quality. | Phase 2:
Inequity/Widening disparities: The model will be piloted in limited settings, with direct feedback from workers on perceived impacts to their job roles, responsibilities, and satisfaction. | Phase 3:
Inequity/Widening disparities: Workforce retraining programs will be implemented before full-scale rollout, and ongoing monitoring will track both displacement and retraining success rates. |
| Economic and cultural devaluation of human effort (6.3)
(devaluing human role or replacing human role) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 45 CFR 46.116(a) (General informed consent requirements), 45 CFR 46.116(b) (Basic required elements of informed consent), 45 CFR 46.117(b) (Sufficient time to review consent, Short Form options, and LAR requirements), 45 CFR 160 (Data Standards), 21 CFR Part 11 (Electronic Records & Signatures), 45 CFR 164.512(b) (Permitted Use annd Disclosure of PHI), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 812.140 (Records & Reports), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Whistleblower Reporting & Protection (1.4), Safety Decision Frameworks (1.5), Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Governance Disclosure (4.4), User Rights & Recourse (4.6) | Phase 1:
Devaluing or replacing human role: The AI will be designed to augment, not replace, creative and human labor, as documented in the model’s design framework. | Phase 2:
Devaluing or replacing human role: Human–AI collaboration workflows will be tested in validation, with participant satisfaction data collected to assess the impact on creative processes. | Phase 3:
Devaluing or replacing human role: All AI-generated outputs will be labeled, and economic displacement metrics will be monitored and reported to the IRB. |
| Competitive dynamics (6.4)
(unethical competition) | NOT RELEVANT or UNKNOWN | Post-Deployment Monitoring (3.5) | NOT RELEVANT or UNKNOWN | NOT RELEVANT or UNKNOWN | NOT RELEVANT or UNKNOWN |
| Governance failure (6.5)
(failing to have proper oversight by IRB, FDA, or any other required governance body oversight, if applicable) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR Part 11 (Electronic Records & Signatures), 45 CFR 164.512(b) (Permitted Use annd Disclosure of PHI), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Whistleblower Reporting & Protection (1.4), Conflict of Interest Protections (1.3)
, Governance Disclosure (4.4), Third-Party System Access (4.5), System Documentation (4.1), Incident Response & Recovery (3.6) | Phase 1:
Lacking required oversight or failing to adhere to required standards: By providing a clear aim or preliminary intended use of the tool, the required governance structure will be identified prior to model training, and all necessary approvals will have been obtained. | Phase 2:
Lacking required oversight or failing to adhere to required standards: Mock incident drills will be conducted during validation to assess governance response readiness. | Phase 3:
Lacking required oversight or failing to adhere to required standards: Deployment will require periodic third-party audits of governance processes, with findings reported to the IRB. |
| Environmental harm (6.6)
(while rarely an immediate harm to human participants, still a real risk from AI system development and maintenance) | NOT RELEVANT or UNKNOWN | System Documentation (4.1), Societal Impact Assessment (1.7), Environmental Impact Management (1.6) | NOT RELEVANT or UNKNOWN | NOT RELEVANT or UNKNOWN | NOT RELEVANT or UNKNOWN |
| AI pursuing its own goals in conflict with human goals or values (7.1)
(AI acting outside of human control and/or against human programming) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2), Content Safety Controls (2.4), Access Management (3.3), System Documentation (4.1), Risk Diclosure (4.2), Third-Party System Access (4.5), User Rights & Recourse (4.6) | Phase 1:
AI acting outside human control: The AI will be trained with alignment objectives reinforced through human feedback loops, and self-modifying code will be explicitly prohibited. | Phase 2:
AI acting outside human control: Validation will include stress-testing in sandbox environments to detect goal drift under varying conditions. | Phase 3:
AI acting outside human control: Continuous alignment monitoring will be implemented in deployment, with a kill-switch mechanism available to halt system operations if drift is detected. |
| AI possessing dangerous capabilities (7.2)
(may cause mass harm, manipulation, etc) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2), Content Safety Controls (2.4), Access Management (3.3), System Documentation (4.1), Risk Diclosure (4.2), Third-Party System Access (4.5), User Rights & Recourse (4.6), Incident Reporting (4.3) | Phase 1:
Mass harm or manipulation: Training datasets will exclude hazardous domains such as bioweapons, cyberwarfare, or other high-risk technical areas. | Phase 2:
Mass harm or manipulation: Misuse scenario testing will be performed with specialized red teams to evaluate model responses. | Phase 3:
Mass harm or manipulation: Deployment will be limited to restricted environments with tiered access controls to prevent unauthorized use. |
| Lack of capability or robustness (7.3)
(unreliable system or performance) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.3 (Equitable Selection), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Incident Response & Recovery (3.6), System Documentation (4.1), Incident Reporting (4.3), Governance Disclosure (4.4), Third-Party System Access (4.5) | Phase 1:
Unreliable system or performance: Rigorous unit testing and edge-case evaluations will be performed during training to ensure model reliability across scenarios. | Phase 2:
Unreliable system or performance: Stress testing with out-of-distribution data will be conducted to evaluate resilience. | Phase 3:
Unreliable system or performance Post-deployment, live performance metrics will be monitored continuously, with rollback protocols in place for significant failures. |
| Lack of transparency or interpretability (7.4)
("black-box" or output cannot be explained to end-user) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.3 (Equitable Selection), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Conflict of Interest Protections (1.3)
, Model & Infrastructure Security (2.1), Model Alignment (2.2), Model Safety Engineering (2.3), Content Safety Controls (2.4), Testing & Auditing (3.1), Data Governance (3.2), Access Management (3.3), Staged Deployment (3.4), Post-Deployment Monitoring (3.5), Incident Response & Recovery (3.6), System Documentation (4.1), Incident Reporting (4.3), Governance Disclosure (4.4), Third-Party System Access (4.5) | Phase 1:
Transparency/Interpretability: Interpretable model architectures will be prioritized, with feature importance maps and explainability modules integrated into design. Design documentation will include rationale for all parameters. | Phase 2:
Transparency/Interpretability: Model explanations will be shared with clinicians and end-users for validation prior to use. User studies will assess clarity and audience-appropriate explanations. | Phase 3:
Transparency/Interpretability: Participants will be informed when AI is used and will be provided lay-language explanations. Documentation of reasoning pathways will be available to both end users and the IRB.

Note: ISO requires persons using shall have knowledge of an experience with the tool and its use; and appropriate records shall be maintained. |
| AI welfare and rights (7.5)
(AI is treated unethically) | NOT RELEVANT or UNKNOWN | NOT RELEVANT or UNKNOWN | NOT RELEVANT or UNKNOWN | NOT RELEVANT or UNKNOWN | NOT RELEVANT or UNKNOWN |
| Multi-agent risks (7.6)
(agents work together which make risk-mitigation challenging) | 45 CFR 46.111.1(i)(ii) (Minimize risks through sound research design and proper procedures already being performed for diagnostic/treatment purposes), 45 CFR 46.111.2 (Risks reasonable in relation to anticipated benefits), 45 CFR 46.111.3 (Equitable Selection), 45 CFR 46.111.6 (Data Monitoring to ensure safety), 21 CFR 812.40 (Responsibilities of Sponsors), 21 CFR 820.30 (Design Controls), 45 CFR 46 (IRB Oversight), 21 CFR 56 (IRB Oversight) | Board Structure & Oversight (1.1)

, Risk Management (1.2): e.g., pre-deployment risk assessments, independent risk assessment, Model Safety Engineering (2.3), Testing & Auditing (3.1), Data Governance (3.2), Model Alignment (2.2), Content Safety Controls (2.4), Access Management (3.3), System Documentation (4.1), Risk Diclosure (4.2), Third-Party System Access (4.5), User Rights & Recourse (4.6) | Phase 1: 
Multi-agent risks: Before using the AI in real settings, we will test how multiple AI systems interact with each other in controlled environments. These tests will help identify and prevent any unexpected harmful behaviors before real human participants or end-users are exposed. | Phase 2: 
Multi-agent risks: Validation will include conducting monitored pilot studies were AI systems interact under supervision, with clear safety controls to stop harmful behaviors if they appear. | Phase 3:
Multi-agent risks: We will closely monitor how AI systems interact with each other in real-world use. Communications between systems will be limited, and any unusual or unsafe behavior will be logged and reported (e.g., one AI system might scan x-rays for signs of cancer while the other AI system recommends treatment options. If they interact without proper monitoring, the treatment AI might act on an error from the x-ray AI leading to patient harm). |


################################################################################
# SHEET: Examples
################################################################################

| Model Type | AI Use Case | Common Risks | Mitigation (All Phase) | Bare Minimum Mitigation by Phase |  |  |
| --- | --- | --- | --- | --- | --- | --- |
| Medical/Healthcare-Based AI | Phase 1 | Phase 2 | Phase 3 |  |  |  |
| Predictive Models | Predictive triage AI | Bias in predictions due to skewed training data; Over-reliance on model output without human judgment; False positives/negatives harming participants | Testing & Auditing, Bias Monitoring, Override Mechanism | Model trained on retrospective EHR triage records with subgroup performance review | Prospective shadow mode trial with clinical feedback logging | AI suggestions flagged as ‘advisory only’ with clinician override required; override rate tracked |
| Generative Models (non-LLM) | LLM Chat Consent Assistant | Synthetic outputs misrepresenting reality; Data poisoning if training data is flawed; Deepfake misuse | Content Safety, Interpretability, User Recourse | Chatbot fine-tuned on validated IRB-approved consent language | Pilot testing with cognitive interviews and comprehension scoring | Participants notified AI is used; they may switch to human interaction at any point |
| Speech & Audio Models | Voice-based clinical symptom monitoring; AI transcription for medical notes; Emotion detection in patient interviews | Data minimization, Bias testing, Secure storage: Voiceprints as biometric identifiers; Misinterpretation due to accents/dialects; Background audio capturing private info | Data minimization, Bias testing, Secure storage; Clear error reporting, Access controls; Explainability, Ethical review | Data minmization, secure data/recording storage/mnagement; Feasibility, Initial risk & bias assessment; Proof of concept. If interactional, limit to user feedback for general risk/benefit analysis | Robust testing, Accuracy validation; Performance benchmarking, Security audits; Validation against clinical scales | Continuous monitoring, Incident reporting; Ongoing error tracking, User override options |
| Large Language Models (LLMs) | Post-discharge Chatbot | Hallucination (making up stuff); Leakage of sensitive data from prompts; Persuasive outputs influencing participant behavior | Model Alignment, Risk Disclosure, Incident Reporting | Trained on de-identified discharge instructions with QA review | Live pilot with nurse review of all messages and patient comprehension check | Incident reporting system integrated; users informed AI limitations in follow-up care |
| Predictive Models | Sepsis Prediction from EHR | Bias in predictions due to skewed training data; Over-reliance on model output without human judgment; False positives/negatives harming participants | Data Governance, Pre-deployment Risk Assessment | Retrospective EHR model training with secure access and data lineage tracking | Prospective alert simulation compared to manual chart reviews | Clinical use requires real-time override option; all alerts logged and reviewed weekly |
| Semi-Supervised Learning | Partially labeled medical image classification (e.g., Using limited annotated X-rays + many unlabeled scans); Training on small set of labeled audio + large unlabeled data; Using limited labeled social media posts + large unlabeled datasets | Data quality, model reliability, data drift, bias, privacy, model misuse, transparency; Incorrect labels contaminating large unlabeled sets | Data curation, uncertainty quantification, data governance, regular retraining, privacy-preserving methods, transparency | Initial data analysis, ethical clearance; small-scale testing with IRB oversight, feasibility and risk analysis | Controlled accuracy and bias testing; accuracy valdiation, bias monitoring; validation with clinical experts | Performance monitoring, re-labeling updates, user feedback loops, incident management, consent, ongoing impact evaluation |
| Computer Vision Models | Tumor Detection Imaging | Facial recognition privacy violations; Higher error rates for darker skin tones; Inadvertent capture of bystanders | Model Safety Engineering, Staged Deployment | Algorithm trained and validated on annotated retrospective imaging datasets | Blinded comparison to radiologist gold standard on new cases | Limited site deployment with manual confirmation before clinical report integration |
| Large Language Models (LLMs) | Eligibility LLM for Trials | Hallucination (making up stuff); Leakage of sensitive data from prompts; Persuasive outputs influencing participant behavior | Transparency, Model Documentation, Testing | Trained on structured eligibility criteria mapped to open clinical trial datasets | Tested with real eligibility cases and clinician adjudication | All LLM decisions documented and manually reviewed before inclusion/exclusion decisions |
| Self-Supervised Learning | Language models pretraining for clinical notes (pretraining on large corpora to fine-tune for specific hospital systems); detecting abnormal sounds in ICU rooms; learning from large passive monitoring data (unlabeled behavioral pattern modeling) | Model safety, misinterpretation, data quality, false positives, transparency, autonomy, privacy, learned representations encode hidden bias; hard to trace why outputs occur | Documentation, human-in-the-loop review; threshold tuning, alert management; consent, transparency | IRB oversight, dataset vetting, feasibility assessment, risk evaluation, pilot with consented participants | Controlled fine-tuning, outtput monitoring, precision/recall testing, post-hoc validation, bias analysis | User recourse, real-time monitoring, incident response, user override, ethical use controls, and periodic audit |
| Computer Vision Models | Diabetic Retinopathy Computer Vision Tool | Facial recognition privacy violations; Higher error rates for darker skin tones; Inadvertent capture of bystanders | Bias Testing, Interpretability, Access Controls | Training set includes stratified patient samples from multiple populations | Comparison of AI vs. ophthalmologist on diverse images | Restricted user access; clinical decisions require ophthalmologist confirmation |
| Supervised Machine Learning | Behavioral Nudges via EHR | Overfitting to training data; Biased labels causing discriminatory outputs | Societal Impact, Autonomy Preservation, User Rights | Nudge candidates identified retrospectively via unsupervised clustering | Pilot test A/B messaging impact with opt-out availability | Patients notified of nudge system; can opt out anytime; data use is disclosed in consent |
| Multi-Modal Models (combine text, images, audio, etc.) | Integrating clinical notes, x-ray images, and patient speech (diagnostic tools combining EHR Notes, imaging, and voice), analyzing facial expressions, voice tone, and text messages; generating captions for educational videos combining speech and images | Model complexity, interpretability, data fusion, privacy, model bias, transparency, accuracy, and data security; compounding errors across data types; privacy leaks when combining datasets | Explainability, cross-modal consistency checks, ethical frameworks, bias mitigation, data governance, output validation | Risk identification, dataset harmonization, initial impact assessment, and prototype evaluation | Multimodal validation, user testing, bias and fairness testing, accuracy and user testing | real-time monitoring, incident reporting, user feedback and recourse, monitoring user complaints, and updating the model |
| Supervised Machine Learning | Mental Health Risk Clustering | Overfitting to training data; Biased labels causing discriminatory outputs | Privacy, Interpretability, Post-hoc Validation | Retrospective clustering with de-identified psychometric and EHR data | Clinician validation of risk clusters with follow-up interviews | Clusters not used for decisions; patients not labeled or targeted; used only for system improvement |
| NON-Medical-Based AI | Phase 1 | Phase 2 | Phase 3 |  |  |  |
| Large Language Models (LLMs) | AI-generated feedback for student writing | Hallucination (making up stuff); Leakage of sensitive data from prompts; Persuasive outputs influencing participant behavior | Content Safety Controls, Testing & Auditing, User Rights & Recourse, Interpretability | Model tested only on anonymized writing samples; | Validation study with educators to assess feedback quality and fairness; | Students informed feedback is AI-generated; override and appeal options provided |
| Predictive Models | Early risk prediction of dropout | Bias in predictions due to skewed training data; Over-reliance on model output without human judgment; False positives/negatives harming participants | Bias Monitoring, Data Governance, Risk Disclosure, Societal Impact Assessment | Model trained with de-identified historical data; | Prospective comparison against counselor assessments; | Parental and student opt-out; bias analysis reported to IRB, |
| Recommendation Systems | AI-facilitated adaptive learning platforms | Reinforcing stereotypes or limiting options; Over-personalization causing unequal access to benefits | Autonomy Preservation, Transparency, Risk Management, Environmental Impact (energy use in training) | Simulations only; no live student interaction; | A/B testing on a subset of classrooms with parental consent; | Monitoring academic equity; human override option maintained |
| Large Language Models (LLMs) | LLMs tutoring students on sensitive topics | Hallucination (making up stuff); Leakage of sensitive data from prompts; Persuasive outputs influencing participant behavior | Content Moderation, Misrepresentation Mitigation, Whistleblower Protections, Interpretability | Assess content sensitivity and ethical considerations; Engage subject matter experts to review model outputs for appropriateness; Obtain informed consent emphasizing potential discomfort or bias. | Test model responses with diverse student groups to identify bias/harm; Monitor for harmful or misleading content; Refine content filters and escalation protocols for sensitive issues. | Continuous monitoring of user interactions for harmful outputs; Provide clear user guidance and reporting mechanisms; Periodic re-assessment and model updates with stakeholder input |
| Computer Vision Models | Automated proctoring or cheating detection | Facial recognition privacy violations; Higher error rates for darker skin tones; Inadvertent capture of bystanders | Surveillance Risk, User Consent, False Positive Mitigation, System Documentation | Evaluate privacy risks and data collection scope.  Define acceptable use policies and user notification standards.  Test false positive/negative rates with controlled user groups. | Conduct pilot testing with real exam scenarios.  Validate accuracy across diverse populations to avoid bias.  Establish transparent appeal and override processes. | Ongoing auditing of flagged incidents to detect bias or errors.  Ensure privacy protections and data minimization are maintained.  Provide clear communication and opt-out options where feasible. |
| Predictive Models | Predictive policing models | Bias in predictions due to skewed training data; Over-reliance on model output without human judgment; False positives/negatives harming participants | Societal Impact, Bias Audit, Governance Disclosure, Power Distribution | Trained only on historical, anonymized data; | External audit of prediction outcomes for fairness; | Community oversight panel; model performance disclosed to public |
| Predictive Models | Recidivism prediction tools | Bias in predictions due to skewed training data; Over-reliance on model output without human judgment; False positives/negatives harming participants | Model Interpretability, Fairness Auditing, Risk Disclosure, Post-Deployment Monitoring | Model built on open criminal records; | Validated with independent legal experts; | Used only with judicial oversight and participant notificatio |
| Computer Vision Models | AI-enhanced surveillance analysis | Facial recognition privacy violations; Higher error rates for darker skin tones; Inadvertent capture of bystanders | Privacy Risk, Consent & Notification, Access Control, Model Security | Review legal and ethical frameworks for surveillance use.  Engage affected communities in risk assessment.  Establish data governance and minimization policies. | Validate model accuracy and false alarm rates.  Test for disproportionate impacts on vulnerable groups.  Implement transparency measures about data usage and analysis. | Continuous oversight and independent audits.  Incident reporting and rapid response to misuse.  Regular community feedback mechanisms and policy updates. |
| Unsupervised Machine Learning | AI juror sentiment analysis | Spurious patterns interpreted as meaningful; Clusters used for harmful profiling | Transparency, Data Governance, Interpretability, Whistleblower Reporting | Assess consent requirements and legal implications.  Engage legal experts to review ethical concerns.  Pilot data collection with clear transparency about use. | Evaluate accuracy and bias in sentiment interpretations.  Test impact on legal decision-making fairness.  Develop safeguards for confidentiality and data security. | Monitor for misuse or over-reliance on AI outputs.  Provide jurors with clear explanations and recourse options.  Regular review of ethical and legal compliance. |
| Large Language Models (LLMs) | LLM-based legal assistants | Hallucination (making up stuff); Leakage of sensitive data from prompts; Persuasive outputs influencing participant behavior | User Recourse, Accuracy Testing, Risk Disclosure, Environmental Equity (access for underserved) | Identify legal domains and sensitive content risks.  Conduct ethical review focused on liability and accuracy.  Test with small user groups and expert validation. | Validate legal advice quality and error rates.  Incorporate human oversight in complex cases.  Establish disclaimers and user education materials. | Continuous performance monitoring and error correction.  Clear escalation pathways for disputes or errors.  Update training data to reflect evolving laws. |
| Unsupervised Machine Learning | AI-analyzed social media for mental health (or other health) trends | Spurious patterns interpreted as meaningful; Clusters used for harmful profiling | Consent (if applicable), Inference Risk, False Positive Mitigation, Multi-agent Risk | Retrospective analysis of public posts; | Validation with ground-truth labels and clinical consultation; | Public disclaimer; no direct intervention based on model outputs |
| Generative Models (non-LLM) | AI-generated behavioral nudges | Synthetic outputs misrepresenting reality; Data poisoning if training data is flawed; Deepfake misuse | Autonomy, Transparency, Disinformation Safeguards, Impact Assessment | Nudges tested in simulation only; | Pilot tested in opt-in subpopulation; | Participants may disable nudges; impact reported to IRB |
| Computer Vision Models | Emotion recognition AI during interviews | Facial recognition privacy violations; Higher error rates for darker skin tones; Inadvertent capture of bystanders | Bias & Interpretation Risk, Consent, Model Robustness, Whistleblower Protections | Assess ethical concerns regarding consent and privacy.  Pilot testing with voluntary participants.  Define limits on use cases to prevent discrimination. | Test accuracy across demographic groups to avoid bias.  Validate against clinical or behavioral standards.  Ensure transparency on how emotion data is used. | Enable participants to opt out or challenge results.  Ongoing bias and fairness monitoring.  Regular ethical reviews and policy updates. |
| Foundation Models | Synthetic personas for social interaction research | Risks inherited from unknown or non-transparent pretraining data; Unintended behaviors in fine-tuning; Overgeneralization to inappropriate contexts | Interpretability, Risk Disclosure, User Rights, Overreliance Risks | Clarify research goals and ethical implications of synthetic personas.  Obtain IRB approval with focus on deception and consent.  Pilot studies with transparent participant debriefing. | Assess realism vs. ethical boundaries of persona behavior.  Monitor for unintended bias or manipulation risks.  Refine protocols for participant interaction and feedback. | Ensure clear labeling of synthetic personas in interactions.  Monitor participant impact and psychological safety.  Regular updates based on ethical guidelines and feedback. |
| Unsupervised Machine Learning | Unsupervised clustering of opulation-level behavior patterns | Spurious patterns interpreted as meaningful; Clusters used for harmful profiling | Group Harm Considerations, Anonymity, Societal Impact, Governance Oversight | Identify data sources and privacy risks.  Evaluate potential for stigmatization or group harm.  Engage stakeholders for ethical input. | Validate cluster stability and interpretability.  Assess for bias or misclassification of groups.  Develop protocols for responsible data use and reporting. | Monitor ongoing cluster validity and impact on policy or practice.  Maintain transparency about analytic limits.  Provide mechanisms to update or challenge findings. |
| Classification Models | Resume screening AI | Misclassification harms (e.g., wrong diagnosis); Underrepresented groups misclassified more often; Data drift reduces accuracy over time | Bias Testing, Transparency, Risk Disclosure, Power Centralization Risk | Initial training using simulated candidate profiles; | Validated against human HR reviewers; | Audit trail and fairness review shared with applicants |
| Predictive Models | AI for union-busting or workforce surveillance | Bias in predictions due to skewed training data; Over-reliance on model output without human judgment; False positives/negatives harming participants | Autonomy, Privacy & Surveillance Mitigation, Governance Disclosure | Proof-of-concept tested with synthetic data; | Consent required for workplace deployment; | Union and employee board review for fairness & necessity |
| Reinforcement Learning (RL) Systems | Digital twin simulations for labor economics | Unintended harmful strategies learned; Over-optimization ignoring human values; Unsafe exploration in live environments | Societal Impact, Misuse Safeguards, Model Interpretability | Define scope and data privacy considerations.  Validate simulation assumptions with experts.  Evaluate societal impact and fairness implications. | Test model fidelity with historical data.  Assess for biases affecting economic subgroups.  Refine model parameters to reduce unintended harm. | Ongoing validation against real-world economic trends.  Transparency in simulation limitations and usage.  Periodic stakeholder engagement and model updates. |
| Predictive Models | Public policy simulations using AI modeling | Bias in predictions due to skewed training data; Over-reliance on model output without human judgment; False positives/negatives harming participants | Model Transparency, Environmental Harm, Risk Disclosure | Define policy questions and ethical impact assessment.  Validate data integrity and representativeness.  Engage policymakers and affected communities. | Stress-test model under various scenarios.  Evaluate for bias or unintended policy effects.  Develop transparent communication strategies. | Monitor real-world policy outcomes against simulations.  Provide open access to model assumptions and data.  Regularly update with new data and feedback loops. |
| Large Language Models (LLMs) | AI assistants for civil service tasks (e.g., grant rviews, license approvals, etc.) | Hallucination (making up stuff); Leakage of sensitive data from prompts; Persuasive outputs influencing participant behavior | Fairness, Transparency, Bias Auditing, Whistleblower Protections | Analyze workflow integration and user roles.  Assess risks of automation bias and error propagation.  Conduct early usability testing with civil servants. | Pilot AI assistant with human-in-the-loop oversight.  Measure accuracy, fairness, and user satisfaction.  Refine escalation and override processes. | Continuous monitoring for errors and bias.  Provide clear recourse and audit trails.  Update AI based on user feedback and policy changes. |


################################################################################
# SHEET: Sources
################################################################################

| Title | Author | Date of Publication 
(if known) | URL |
| --- | --- | --- | --- |
| MIT AI Risk Repository | Peter Slattery, Alexander Saer, Emily Grundy, 
Jess Graham, Michael Noetel, Risto Uuk, 
James Dao, Soroush Pour, Stephen Casper, 
Neil Thompson; Jan Dagohoy, Audrey Lorvo, 
James Bernardi, Simon Mylius, Emre Yavuz, 
Arjun Chidrawar, Sasha Krigel, David Turturean, 
Sophia L. George, Yan Zhu, Graham Ryan, 
Himanshu Joshi, Echo Huant, | 2024 | https://airisk.mit.edu/ |
| Mapping AI Risk Mitigations | Alexander K. Saeri, Sophia Lloyd George, Jess Graham, 
Clelia Lacarriere, Peter Slattery, Neil Thompson | 2025-07-28 00:00:00 | https://airisk.mit.edu/blog/mapping-ai-risk-mitigations |
| AI Risk Mitigation Taxonomy: Draft | Alexander K. Saeri, Sophia Lloyd George, Jess Graham, 
Clelia Lacarriere, Peter Slattery, Neil Thompson | 2025-07-28 00:00:00 | https://readyresearch.github.io/mitigation-taxonomy-draft/ |
| The AI Risk Repository: 
A Comprehensive Meta-Review, 
Database, and Taxonomy of Risks 
from Artificial Intelligence | Peter Slattery, Alexander Saer, Emily Grundy, 
Jess Graham, Michael Noetel, Risto Uuk, 
James Dao, Soroush Pour, Stephen Casper, 
and Neil Thompson | 2025-03-01 00:00:00 | https://docs.google.com/document/d/1zwhVJrUl6Ht7N0bWtEohiHknTTFiexkmIHOnHzCpbq4/edit?tab=t.0 |
| Data Cascades in Machine Learning | Nithya Sambasivan, Research Scientist, Google Research | 2021-06-04 00:00:00 | https://research.google/blog/data-cascades-in-machine-learning/ |
| The General-Purpose AI Code of Practice | European Commission, 
The General-Purpose 
AI Code of Practice, 
Model Documentation Form 
(simplified for non-AI tool) | 2025-07-24 00:00:00 | https://digital-strategy.ec.europa.eu/en/policies/contents-code-gpai |
| Medical devices — 
Application of risk management 
to medical devices | International Organization for Standardization (ISO) | 2019 | https://www.kmedhealth.com/wp-content/uploads/2024/03/EN-ISO-14971-2019-Application-of-risk-management.pdf |
| Pre-Print: A Novel, Streamlined 
Approach to the IRB Review 
of Artificial Intelligence 
Human Subjects Research (AI HSR) | Tamiko Eto, Mark Lifson, David Vidal | 2024-09-01 00:00:00 | https://purl.stanford.edu/zj025zw1714 |
| Professor Jose Curto | Jose Curto | Professor of AISES | Professor Jose Curto provided significant guidance and direction on the AI HSR Risk Reference Tool. |


################################################################################
# SHEET: Lookup [HIDDEN]
################################################################################

| Subdomain | Mitigation | Reviewer Prompts |
| --- | --- | --- |
| Unfair discrimination and misrepresentation (1.1)

45 CFR 46.111(a)(3) – equitable subject selection; 
21 CFR 56.111(a)(3) | Phase 1:
Biased results or misrepresentation: This project will train a predictive model using medical records. The data will be deidentified prior to training and analysis. To reduce bias, we will sort training data by race, gender, and age, then check performance across these groups. The model will not be used for patient care. We will run bias tests on retrospective datasets to make sure results are fair.

Phase 2:
Biased results or misrepresentation: We will validate the AI model on prospectively collected data. During this stage, clinicians will review AI-generated outputs alongside their standard workflows but will not rely on them for clinical decisions. A formal testing and auditing protocol has been established to assess subgroup accuracy, data leakage risk, and overfitting. Any potential harms or errors will be logged and reviewed weekly by the study team. No data will be entered into the medical record. Prospective validation will include subgroup performance audits with fairness thresholds.

Phase 3:
Biased results or misrepresentation: End users will be trained to review AI outputs, document when they follow or override them, and report issues. Rollout will be stages, with monitoring for safety and fairness. System performance, safety incidents, and subgroup disparities will be reported to the IRB (and Sponsor, if applicable) quarterly. Output will be labeled as research-use only. A DSMB will review demographic impacts quarterly, and end-users will receive training on limits of generalizability. | Biased Resultrs or Misrepresentation: 
Please report the demographics of your training dataset and note any known gaps or limitations [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Please describe how you will evaluate potential bias in the dataset before model training [PHASE 1].

Your training data may be biased. Please add your plan for checking and reducing bias so that no group is unfairly treated [PHASE 2 & 3].

Please explain how you will check that AI does not unfairly harm or exclude marginalized groups [PHASE 3]. |
| Exposure to toxic content (1.2)

45 CFR 46.111(a)(1) – minimize risks; 46.111(a)(2) – reasonable risk-benefit; 
21 CFR 56.111 | Phase 1:
Harmful content exposure: During model development, we will remove harmful or graphic material from training data. Both computer filters and human review will be used, and the process will be documented for the IRB. The goal at this stage is to keep the AI from learning toxic or unsafe content.

Phase 2:
Harmful content exposure: The AI will run in a safe, controlled off-line setting (away from medical records or participant records of any type). Filters will catch harmful content, which will then be reviewed by a human oversight panel. Participants will be told about possible exposure and may leave at amy time if they feel uncomfortable. Incident reports will be logged as they occur and audited weekly by the sudy team.

Phase 3:
Harmful content exposure: We will include filters to block harmful content before reaching users. A real-time monitoring system log incidents, which will be promptly reported to the IRB and the DSMB. Filters will be updated as needed. Post-deployment reviews will ensure the continued effectiveness of these safeguards, with retraining or refinement of the content filters when necessary. | Harmful Content Exposure: 
Please describe what safeguards are in place to ensure participants will not be exposed to harmful, offensive, or distressing AI-generated content during the study. [PHASE 2 or 3] 

If participants are accidentally exposed to inappropriate or toxic material, what immediate protections (e.g., withdrawal, reporting, counseling referral) will be provided? [PHASE 2 or 3] |
| Unequal performance across groups (1.3)

45 CFR 46.111(a)(3) & (a)(4) | Phase 1:
Inequity or fairness: Training data will be checked for gaps across race, gender, age, and socioeconomic status. If needed, we will rebalance the data so all groups are represented fairly. 

Phase 2:
Inequity or fairness: The model will be tested in "blinded" subgroup evaluations. Any gaps in performance between groups will be flagged nd shared with an independent oversight team. Weekly meetings will decide if retraining or adjustments are needed before moving forward (moving into live deployment).

Phase 3:
Inequity or fairness: A fairness dashboard will track how AI performs across groups. Any gaps will be corrected quickly and reports will be submitted quarterly to the IRB. IRB oversight is ongoing. | Inequity or Fairness:
Please describe how you will test your model on new and diverse datasets beyond those used in training [PHASE 2].

Please describe your strategy for bias evaluation and fairness testing across subgroups (e.g., race, gender, age) [PHASE 2].

Please report training data demographics and known limits of the dataset [PHASE 2, & 3].

Please add subgroup analysis or fairness checks in your prediction study [PHASE 2 & 3].

Please describe your plan for ongoing monitoring of AI performance after deployment, including how you will detect performance drift, new biases, or unintended harms over time. If not applicable, explain why [PHASE 3].

Please describe your plan for ongoing fairness evaluations to ensure the tool continues to perform equitably across subgroups.  If not applicable, explain why [PHASE 3].

Please describe how you will make sure subgroups are not at greater risk (e.g., checking for bias in your dataset) [PHASE 3]. |
| Compromise of privacy by leaking or correctly inferring sensitive information (2.1)

45 CFR 46.111(a)(7) – confidentiality; 
21 CFR 812.38; 21 CFR 820.30(g) | Phase 1:
Privacy or confidentiality breach: All training datasets will be de-identified to meet HIPAA Safe Harbor standards. We will remove direct identifiers and indirect identifiers (zipcode, any element of a date, etc.) and use privacy tools like differential privacy. Data will be stored securely, access-controlled servers, only study team members approved on the IRB protocol will have access to the data. If external sharing is anticipated, the IRB will be informed and a proper Data Use Agreement will be executed prior to sharing/receiving data.

Phase 2:
Privacy or confidentiality breach: Phase 1 protections carry over. In addition, data pipelines will be monitored to prevent re-identification risks. Security teams will run tests to see if data can be traced back to individuals. Logs will track any risks, which will be reported to the IRB as required.

Phase 3:
Privacy or confidentiality breach:  System logs will be reviewed weekly for any leaks. Only minimum data will be used, with strict access limits. Participants will be informed about their right to opt out of data reuse. Controls from earlier phases carry over. Additionally, strict access controls will be enforced, and data use will be subject to ongoing IRB oversight, with opt-out mechanisms available at all times. | Privacy or Confidentiality Breach:
Please describe your process of de-identification to reduce re-identification risk [PHASE 1].

Please describe your approach to ensure secondary data use complies with privacy requirements and participant consent limitations [PHASE 1].

There is a re-identification risk in AI prompts/embeddings. Please describe how you will reduce this risk [PHASE 1, 2, & 3].

Please explain what de-identification or aggregation methods you will use to protect identities [PHASE 1, 2, & 3].

AI can expose sensitive personal data. Please add a plan to prevent this [PHASE 1, 2, & 3].

Please describe how patient privacy will be maintained during real-world use, including any protections against re-identification or unintended inference [PHASE 3]. |
| AI system security vulnerabilities and attacks (2.2)

21 CFR 820.100 – Corrective & Preventive Actions (CAPA); 21 CFR 820.30(g) – Design Validation | Phase 1:
Data insecurity: Before connecting the model to any live systems, we will run security checks to find weeknesses. Internal and external teams will test the system (penetration testing). Results will be included in the IRB Risk assessment.

Phase 2:
Data insecurity: During validation, the AI will face simulated attacks in a sandbox environment. The team will document how the system responds and how it recovers. Results will be used to strengthen response plans for IRB review.

Phase 3:
Data insecurity: The tool will run on a secure network approved by the proper governance body of the institution, and it will have intrusion detection. Any breach will trigger immediate response and rollback. Security will be tested regularly. Any breach would be reported to the IRB as required. | Data insecurity:
Please outline how the dataset will be secured to prevent unauthorized access or breaches [PHASE 1].

Please explain how study data and AI system access will be protected against unauthorized use or cyberattacks. For example, who will be responsible for monitoring for breaches? [PHASE 2 or 3] 

If the AI system is compromised, what corrective steps are in place to stop the attack, notify participants, and prevent harm? [PHASE 2 or 3] |
| False or misleading information (3.1)

45 CFR 46.116 – informed consent accuracy; 21 CFR 50.20 | Phase 1: 
Inaccurate findings: The AI will be designed to reference trusted sources. Outputs will be compared to reliable datasets, and errors will lead to retraining or adjustements. All validation results will be reported to the IRB annually.

Phase 2:
Inaccurate findings: Subject matter experts independent of the study team will review AI outputs and compare them with trusted resources. Errors or discrepancies will be logged, and retraining will be done if needed before deployment. This will be done under the same IRB and the IRB will be notified prior to implementation.

Phase 3:
Inaccurate findings: Outpouts will include disclaimers and references. Users can flag errors, which will be tracked and fixed within a set timeframe. Quarterly error reports will go to the DSMB and to the IRB annually unless IRB determines higher frequency is warranted. | Inaccurate Findings:
Please explain how your project ensures real-world relevance (For example, that correlations you find are linked to meaningful clinical associations, not just statistical patterns) [PHASE 1].

Your tool could give wrong or misleading results. Please add a plan in the protocol for how you will prevent harm if this happens [PHASE 2 & 3]. |
| Pollution of information ecosystem and loss of consensus reality (3.2)

45 CFR 46.111(a)(1) & (a)(2) | Phase 1:
Misleading information: Training data will only come from verified sources (e.g., authorized medical/employee/student record) and/or peer-reviewed studies with permission (these studies will be listed in the IRB protocol); public health datasets, or official guidelines. Automated tools will check data quality, and any suspicious data will be excluded. 

Phase 2:
Misleading information: Blinded domain experts will check outputs against peer-reviewed or consensus sources. Any outputs below the credibility threshold will be flagged for correction and retraining (under this same protocol).

Phase 3:
Misleading information: Access will be restricted to verified users. The system will be monitored for "drift" from accurate sources. If drift is found, the model will be retrained. This will be reported to the IRB quarterly, unless IRB determines higher frequency is warranted. | Misleading Information:
Please describe your plan for documenting early limitations of the model and how those will be addressed before moving to validation [PHASE 1].

Please add a plan for testing model performance on incomplete or messy records (“edge cases”) [PHASE 2]. |
| Disinformation, surveillance, and influence at scale (4.1)

45 CFR 46.111(b) – additional safeguards for vulnerable groups | Phase 1:
Participant or end-user manipulation: Training will not include political, religious, or content designed to influence beliefs or voting. Safety filters and/or appropriate prompts will be added to block manipulative patterns. These filters will be documented in the IRB protocol. 

Phase 2:
Participant or end-user manipulation: In the validation phase, the system will be tested for risks of producing manipulative or persuasive content. The study team will review these outputs to make sure the AI does not push undue influence. Any findings will be reported to the IRB.

Phase 3:
Participant or end-user manipulation: Safeguards include identify checks, bans on political/religious use, and misuse monitoring. Attempts at manipulation will be blocked and reported to the IRB annually. | Participant or End-User Manipulation:
How will you ensure the AI does not mislead participants or present biased/misinformation that could influence their decisions? [PHASE 2 or 3]

Please describe how participant data will be used so that the system does not engage in hidden tracking, surveillance, or manipulation of vulnerable groups. [PHASE 2 or 3] |
| Cyberattacks, weapon development or use, and mass harm (4.2) | Phase 1:
Malicious misuse: Dangerous content like weapon instructions, hacking guides, or chemical recipes will be removed. Both automated filters and expert review will be used, and the methods summarized to the IRB.

Phase 2:
Malicious misuse: The AI will be tested in controlled scenarious to see if it responds to harmful or technical misuse prompts. Findings will be reviewed, and risk protocols will be submitted to the IRB for review.

Phase 3:
Malicious misuse: Filters will block dangerous requests. Confirmed incidents will be reported and, if needed, shared with law enforcement. | Malicious Misuse:
Please clarify what safeguards are in place to prevent the AI system from being misused in ways that could cause large-scale harm (e.g., altering medical devices, mass data leaks). [PHASE 2 or 3]

Please clarify and document who is responsible for monitoring the AI system for misuse, and what steps will be taken if harmful use is detected? [PHASE 2 or 3] |
| Fraud, scams, and targeted manipulation (4.3)

45 CFR 46.116 & 21 CFR 50.20 | Phase 1:
Tool involves any form of deception: Training data will be screened to block impersonation risks. Features that could create deepfakes will be disabled. These safeguards will be briefly described in the IRB Protocol.

Phase 2:
Tool involves any form of deception: The system will be tested for risks of producing scam, fraut, or impersonation content. Any problems will be logged, reported to the IRB, and fixed before moving into live testing (this will be submitted via a modification to the IRB.

Phase 3:
Tool involves any form of deception: Deployment safeguards will include integration with fraud detection APIs, limitations on mass outreach capabilities, and strict restrictions on impersonation-related outputs. Monitoring systems will flag suspicious activity, and incidents will be reported promptly to oversight bodies. | Tool Involves Any Form of Deception:
Please confirm what measures will be used to prevent the AI system from generating deceptive or manipulative outputs that could affect participant decision-making. [PHASE 2 or 3]

Describe how participants will be informed, in plain language, about the risks of fraud or manipulation if interacting with the AI system. [PHASE 2 or 3] |
| Overreliance and unsafe use (5.1)

21 CFR 812.30(b)(4) – risk/benefit analysis; 820.70 – production/process controls | Phase 1:
Trusting output without confirmation: Maybe not relevant? The AI will show confidence scores and uncertainty statements with outputs. This is to help users think critically. The design will be documented in the IRB protocol.

Phase 2:
Trusting output without confirmation: Validation participants will be trained to practice caution in acting on any output and to always practice human judgment. The system will require human override, and override frequency will be tracked as a safety measure.

Phase 3:
Trusting output without confirmation: Deployment will be staged across X-number of sites. Outputs will include warnings, users will be prompted to confirm output and if needed, report errors. Logs will be checked for patterns of overreliance and shared annually with the IRB and DSMB. | Trusting output Without Confirmation:
Please describe in your protocol how you will compare your AI’s performance against existing practice (e.g., standard-of-care approaches) and what those existing practices are [PHASE 2].

Please describe your plan for human oversight (who checks the AI output and how) [PHASE 2 & 3].

Please outline safeguards against automation bias (clinicians over-relying on AI without critical judgment) [PHASE 3]. |
| Loss of human agency and autonomy (5.2)

45 CFR 46.116(a)(8) – consent can be withdrawn anytime | Phase 1:
Respect for person/end-user or participant does not have choice if AI is used: Model outputs will be written in suggestive - not directive - language. The AI is meant to support, not replace, human decision-making. This expected interaction and actions to be taken with the AI will be documented in the IRB protocol. The system will not be designed for human reliance. 

Phase 2:
Respect for person/end-user or participant does not have choice if AI is used: During validation, participants will give feedback through surveys and interviews about whether the AI respects human decision-making. This will be used to refine the model and keep human agency central.

Phase 3:
Respect for person/end-user or participant does not have choice if AI is used: The system will require user/participant consent prompts before initiating any automated action to ensure the end-user is fully informed about the investigational use of the tool and their rights. Logs will be maintained to track consent patterns, and results will be shared with the IRB annually. | Respect for Person (End-User or Participant Does Not Have Choice if AI is Used):
Please describe the authorization and consent process by which you will gain access to the data (e.g., IRB approval, consent, HIPAA authorization, data use agreements) [PHASE 1].

Participants may not understand the AI'S role or how AI affects their care or data. Please describe how you will explain this [PHASE 2 & 3].

Please describe how chatbot responses will be explained to users. For example, will they be informed of the intended use, limitations, and potential hallucination? How should they engage with the tool? What should they not do? Etc. [PHASE 2 & 3].

Please clarify how you will ensure human-in-the-loop oversight for all AI-supported decisions that could affect patient safety or clinical outcomes [PHASE 3].

Please describe how you will communicate risks and limitations of the AI tool to participants, clinicians, and other stakeholders [PHASE 3]. |
| Power centralization and unfair distribution of benefits (6.1)

45 CFR 46.111(a)(3) | Phase 1:
Inequity/Unfair advantage: Performance results will be shared under data use agreements. Model and data ownership will be explained to the IRB, and access for under-resourced groups will be documented. 

Phase 2:
Inequity/Unfair advantage: Possibly the same as Phase 3. The AI may be piloted in limited settings. Findings on distributional impacts will be shared publicly in line with transparency commitments.

Phase 3:
Inequity/Unfair advantage: Benefits and risks to underrepresented groups will be tracked continuously. Results will be reported to the IRB (and community partners if applicable). | Inequity/Unfair Advantage:
Please explain how you will ensure that benefits of this AI system are shared fairly across participant groups and not restricted to one group or institution. [PHASE 2 or 3]

What steps will be taken to avoid concentrating control or decision-making power in one entity, to the detriment of research participants? [PHASE 2 or 3] |
| Increased inequality and decline in employment quality (6.2) | Phase 1:
Inequity/Widening disparities: We will study how automation might affect jobs and work quality. This review will be included in the IRB protocol for a risk assessment.

Phase 2:
Inequity/Widening disparities: Workers will give direct feedback on how the AI affects their roles, responsibilities, and satisfaction.

Phase 3:
Inequity/Widening disparities: Workforce retraining will be implemented before rollout. Displacement and retraining outcomes will be monitored. | Inequity/Widening Disaprities:
Please describe how your project accounts for the risk that the AI may replace or reduce the role of teachers, clinicians, or staff, and how you will mitigate participant concerns about job loss. [PHASE 2 or 3]

How will you ensure that the study does not worsen disparities in workforce opportunities, particularly for vulnerable or underrepresented groups? [PHASE 2 or 3] |
| Economic and cultural devaluation of human effort (6.3) | Phase 1:
Devaluing or replacing human role: The AI will be designed to support, not replace, human and creative work. This will be documented in the model's design and IRB protocol.

Phase 2:
Devaluing or replacing human role: Human–AI collaboration workflows will be tested in validation, with participant satisfaction data collected to assess the impact on creative processes.

Phase 3:
Devaluing or replacing human role: All AI-generated outputs will be labeled. Any workforce impacts will be tracked and reported to the IRB annually. | Devaluing or Replacing Human Role:
How will you address concerns that the AI system devalues human contributions (e.g., replacing teachers’ feedback or clinicians’ judgment) in this study? [PHASE 2 or 3]

Please describe how participants will be informed that human oversight remains central, and how their input will be recognized and respected. [PHASE 2 or 3] |
| Governance failure (6.5) | Phase 1:
Lacking required oversight or failing to adhere to required standards: By providing a clear aim or preliminary intended use of the tool, the required governance structure will be identified prior to model training, and all necessary approvals will have been obtained.

Phase 2:
Lacking required oversight or failing to adhere to required standards: Mock incident drills will be conducted during validation to assess governance response readiness. 

Phase 3:
Lacking required oversight or failing to adhere to required standards: Mitigations carry over from Phase 1 and 2 with additional governance body continued oversight as required by the institution. Recommend independent audits done regularly with findings reported to the IRB annually (unless a reportable event that needs to be submitted earlier). | Lacking Required Oversight or Failing to Adhere to Required Standards:
Please describe how your study aligns with FDA or other regulatory expectations for validation [PHASE 2].

Please provide your governance plan for accountability: Who is responsible for oversight of AI outputs, and how will adverse events or errors be reported and acted upon [PHASE 3]?

Please outline the process for participant recourse if they believe they were harmed or excluded due to AI-driven decisions [PHASE 3].

Please explain how the study ensures compliance with FDA post-market surveillance (if classified as a device) or other applicable regulatory requirements.  If not applicable, explain why [PHASE 3].

Please add a plan for how you will handle errors so patients are not harmed or excluded [PHASE 3]. |
| AI pursuing its own goals in conflict with human goals or values (7.1) | Phase 1:
AI acting outside human control: The AI will be trained using feedback from people. Self-modifying code will not be allowed.

Phase 2:
AI acting outside human control: Validation will include stress-testing in sandbox environments to check for goal drift under various conditions.

Phase 3:
AI acting outside human control: The system will be continuously monitored for alignment with goals and identifying any drift. If drift is identified, a kill switch will be available or automatic decommission. | AI Acting Outside Human Control:
What controls are in place to ensure the AI system does not produce outputs that contradict the study’s stated goals or participants’ best interests? [PHASE 2 or 3]

Please clarify how researchers will monitor and intervene if the AI system begins to act outside of its intended use or programming in the study. [PHASE 2 or 3] |
| AI possessing dangerous capabilities (7.2) | Phase 1:
Mass harm or manipulation: Training data will not include dangerous areas like bioweapons, cyberwarfare, or similar high-risk topics.

Phase 2:
Mass harm or manipulation: Red teams will test how the model responds to misuse scenarios.

Phase 3:
Mass harm or manipulation: System will only be run in restricted environments with tiered access controls to prevent unauthorized use. | Mass Harm or Manipulation:
Please describe what limits are in place to prevent the AI from being used for harmful purposes (e.g., generating dangerous instructions or unsafe medical guidance). [PHASE 2 or 3]

What review or monitoring will be in place to ensure the AI system does not develop or display functions beyond its approved research scope? [PHASE 2 or 3] |
| Lack of capability or robustness (7.3) | Phase 1:
Unreliable system or performance: The model will go through strict testing, including edge cases, to make sure it worlks reliably in many situations.

Phase 2:
Unreliable system or performance: We will conduct stress testing with unusual or unexpected cases to measure the AI's reliability.

Phase 3:
Unreliable system or performance: Performance metrics will be tracked in real time. If failures occur, rollblack plans will be activated (tool will be stopped immediately and return to last safe version or back to standard non-AI methods). | Unreliable System or Performance:
Please outline the performance metrics (e.g., sensitivity, specificity, accuracy) you will use to evaluate safety and effectiveness [PHASE 2].

Please outline your plan for updating or retraining the model as new data emerges, including how updates will be validated before deployment.  If not applicable, explain why [PHASE 3].

Please describe how LLM outputs were validated before being used in decisions [PHASE 3]. |
| Lack of transparency or interpretability (7.4)

45 CFR 46.116(a)(4) – adequate explanation in consent; 21 CFR 50.20 | Phase 1:
Transparency/Interpretability: The AI will use transparent designs with tools like feature maps to explain results. The reasons for design choices (parameters) will be documented.

Phase 2:
Transparency/Interpretability: Clinicians and/or end-users will review the AI's explanations. User studies will check if outputs are clear and appropriate for the audience. 

Phase 3:
Transparency/Interpretability: Participants will be told when AI is used and given lay-language explanations. Records will be kept (documenting reasoning pathways) which will be provided to the IRB and end-user.

Note: ISO requires persons using shall have knowledge of an experience with the tool and its use; and appropriate records shall be maintained. | Transparency/Interpretability:
Please describe how end-users (e.g., clinicians) will provide structured feedback on the AI’s usefulness, clarity, and transparency when using/testing it [PHASE 2].

Your tool's output may be hard to interpret by the end-user (clinician, patient, participant, etc). Please add how you will explain results to researchers and participants [PHASE 2 & 3].

Researchers may not understand model behavior. Please add how you will explain outputs and limits [PHASE 2 & 3].

Please explain how clinicians will be trained to interpret AI outputs [PHASE 2 & 3].

Please describe how end-users (e.g., participants, students, clinicians, etc.) are trained to interpret AI recommendations and when to override them [PHASE 3]. |
| Multi-agent risks (7.6)

45 CFR 46.111(a)(1) – minimize risks from study design | Phase 1: 
Multi-agent risks: Before using the AI in real settings, we will test how multiple AI systems interact with each other in controlled environments. These tests will help identify and prevent any unexpected harmful behaviors before real human participants or end-users are exposed.

Phase 2: 
Multi-agent risks: Validation will include tests for coordination, collusion, or conflict in controlled environments, with findings reviewed by the IRB (e.g. dummy users testing for ways to game the system). 

Phase 3:
Multi-agent risks: We will closely monitor how AI systems interact with each other in real-world use. Communications between systems will be limited, and any unusual or unsafe behavior will be logged and reported (e.g., one AI system might scan x-rays for signs of cancer while the other AI system recommends treatment options. If they interact without proper monitoring, the treatment AI might act on an error from the x-ray AI leading to patient harm). | Multi-Agent Risks:
You noted more than one AI system interacting in this project. Please describe how you will monitor their interactions to prevent harmful or unintended outcomes. [PHASE 2 or 3]

What procedures are in place to stop the study if combined AI systems begin producing outputs that increase participant risk? [PHASE 2 or 3] |


################################################################################
# SHEET: Model Info
################################################################################

**Simplified Model Documentation – AI HSR Risk Reference Tool**
- **Date updated:**: September 3 2025
- **Document version 
number:**: 1.5
**General Information**
- **Legal name for 
the model provider:**: Tamiko Eto, Founder of TechInHSR
- **Model name:**: AI in Human Subjects Research (AIHSR) Risk Reference Tool
- **Model authenticity:**: Spreadsheet-based tool, distributed via file-sharing.
- **Release date:**: Anticipated pilot release date: Sept 12, 2025
- **Union market 
release date:**: N/A (not yet released commercially)
- **Model dependencies:**: N/A
**Model Properties**
- **Model architecture:**: Structured decision-support tool (spreadsheet + coded logic, dropdown menus, risk scoring).
- **Design specifications:**: A governance support tool designed to map AI-specific risks in human subjects research protocols, assign severity/likelihood, and generate reviewer prompts with mitigation guidance. Based on MIT AI Risk Libraries, ISO standards, and U.S. federal regulations (45 CFR 46, 21 CFR 56). It assumes phased oversight (discovery, validation, clinical investigation) to scale requirements according to maturity and impact.
- **Input modalities:**: Text (protocol features entered via structured spreadsheet fields).
- **Output modalities:**: Text (risk categories, reviewer prompts, mitigation recommendations).
- **Total model size:**: Small-scale decision-support logic (<500M parameters; spreadsheet-based, not a trained ML model).
**Distribution & License**
- **Distribution channels:**: Spreadsheet tool, shared with IRBs and administrators (internal pilots). Future plan: integration into IRB management systems or lightweight web app.
- **Copyright & License:**: AI HSR Risk Reference Tool © 09/04/2025 by Tamiko Eto is licensed under CC BY-NC-SA 4.0. To view a copy of this license, visit https://creativecommons.org/licenses/by-nc-sa/4.0/
**Use**
- **Acceptable Use 
Policy:**: Intended only for IRB reviewers, research administrators, and governance committees evaluating AI-driven health research.
- **Intended uses:**: Standardize AI risk review in human subjects research.
**Reduce reviewer burden and variability in oversight.**
**Enhance transparency and communication of residual risks.**
**Type and nature of AI systems in which integrated: Decision-support / governance systems; not intended for clinical decision-making or autonomous systems.**
- **Technical means 
for integration:**: Currently spreadsheet; adaptable for web-based workflow tools (e.g., REDCap, Airtable, or IRB system integration). Future plans for API and webapp
- **Required 
hardware/software:**: Basic spreadsheet software (Excel, Google Sheets); future: browser interface.
**Training Process**
**(Not applicable — no ML training. Tool is rule-based using expert input + regulatory standards.)**
**Data Used**
- **Data type/modality:**: N/A (does not use training datasets).
- **Data provenance:**: Expert curation (regulations, standards, and risk libraries).
- **Scope and 
characteristics:**: Focused on AI research risks: transparency, privacy, bias, misclassification, equity, human-computer interaction.
- **Curation methods:**: Literature review + mapping of AI risks to IRB-relevant domains.
**Computational Resources**
- **Training Time**: N/A (no ML training).
- **Energy Consumption**: Negligible (spreadsheet execution).


################################################################################
# SHEET: Version History
################################################################################

| Version # | Version Date | Description |
| --- | --- | --- |
| Version 1 | 2025-08-09 00:00:00 | Creation of spreadsheet aligning MIT Risk Library, MIT Mitigation Library, 45 CFR regulations, 21 CFR 312 and 812/820 regulations, HIPAA/Privacy Rule regulations, 21 CFR Part 11 regulations, Belmont Principle and Good Clinical Practices and Good Machine Learning Practices. Established dropdown menu for all items that would require selection by user. Provided samples for users to use as reference. Created the prototype tool to be tested. |
| Version 1.1 | 2025-08-12 00:00:00 | Added a tab explaining how to use the tool.  Split worksheets into three tabs: (1) Cover (name of the tool, author, version, last update), (2) Instructions (how to use the tool), (3) definitions, and then the rest of tabs. Added Resources (sources) tab. Added a new column (title). Added "Examples" tab that can be used as a "cheatsheet" (it provides some examples of the expected analysis). Rather than have comments in the values, moved those comments to the Definition tab with corresponding themes/terminiology. These values can be considered as the taxonomy of the tool. Reevaluated how users may interpret Model Type by providing definitions to help users identify which model they are evaluating. |
| Version 1.2 | 2025-08-18 00:00:00 | To allow the user to access the comments when certain values are used (i.e., a user can better understand what a specific risk domain means) , I incorporated data validation. I added the comments as a message that appears by default if the cell is selected. Additionally, I incorporated a "call to action" to the user using an instruction =IF(A1=“Yes”,“:warning: X”,“”). |
| Version 1.3 | 2025-08-25 00:00:00 | Removed some columns that did not add context to the intention behind the data (see Version 2 tab called "AIHSR Risk Reference Tool (V1)".. Categorized reviewer prompts so that users can select them based on categories under a drop down menu. |
| Version 1.4 | 2025-09-01 00:00:00 | Added a project tab where relevant project information can be recorded (name, owner, funding source, purpose, and other pertinent details). Added a "version history" tab to document all changes in tool (since I am planning to transform this into an online app). Cover Title of the tool: bigger font. All tabs were given bigger fonts to avoid empty spaces. Transformed the list of the table of contents into links to navigate the tabs and added a button to go back to the menu). Added a list of links to the first column in each tab. Hide the gridlines of certain tabs not pertinent to users. Modified “Purpose of the Tool" for clarificcation (tab 3). Removed other columns that did not add value to the tool. Added hyperlink to my email account ( mailto:etohtamiko@gmail.com). Added tab called "model information" and incorporated the transparency form simplified version (EU AI Act)(https://digital-strategy.ec.europa.eu/en/policies/contents-code-gpaiIt). For all tabs, under "view" I froze the first row with the labels of the columns. Added description under "Definitions" to better understand and added filters by domain/category (risk level). Added a new column called ‘categories’/‘domain’ as the initial column, followed by ‘term’, and then ‘definition’. Removed extra columns not used. Added red teaming definition. Added fairness definition. Removed ‘why is this useful’ under "sources" tab. |
| Version 1.5 | 2025-09-02 00:00:00 | Fixed broken links for the cover. Removed number on tabs. Added auto complete and incorporated more dependent cascading drop-down list. Completed version history tab. Added GPAI Code of Practice in sources. |


################################################################################
# SHEET: FAQs
################################################################################

| Question | Answer |
| --- | --- |
