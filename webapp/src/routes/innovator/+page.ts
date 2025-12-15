import { base } from '$app/paths';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [questionsRes, subdomainsRes, domainsRes, unifiedRes, traceabilityRes] = await Promise.all([
		fetch(`${base}/data/assessment-questions.json`),
		fetch(`${base}/data/risk-subdomains.json`),
		fetch(`${base}/data/risk-domains.json`),
		fetch(`${base}/data/unified-schema.json`),
		fetch(`${base}/data/traceability.json`)
	]);

	const questions = await questionsRes.json();
	const subdomains = await subdomainsRes.json();
	const domains = await domainsRes.json();
	const unified = await unifiedRes.json();
	const traceability = await traceabilityRes.json();

	// Build phaseMitigations from subdomains (phaseGuidance is now on each subdomain)
	const phaseMitigations: Record<string, Record<string, string>> = {};
	for (const subdomain of subdomains.riskSubdomains) {
		if (subdomain.phaseGuidance) {
			phaseMitigations[subdomain.id] = subdomain.phaseGuidance;
		}
	}

	return {
		questionCategories: questions.questionCategories,
		phaseMitigations,
		subdomains: subdomains.riskSubdomains,
		domains: domains.riskDomains,
		modelTypeRelevance: unified.modelTypeToSubdomainRelevance,
		vulnerabilityMultipliers: unified.vulnerabilityMultipliers,
		links: traceability.links
	};
};
