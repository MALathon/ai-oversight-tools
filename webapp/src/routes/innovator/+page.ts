import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [questionsRes, phaseMitigationsRes, subdomainsRes, domainsRes, unifiedRes] = await Promise.all([
		fetch('/data/assessment-questions.json'),
		fetch('/data/phase-mitigations.json'),
		fetch('/data/risk-subdomains.json'),
		fetch('/data/risk-domains.json'),
		fetch('/data/unified-schema.json')
	]);

	const questions = await questionsRes.json();
	const phaseMitigations = await phaseMitigationsRes.json();
	const subdomains = await subdomainsRes.json();
	const domains = await domainsRes.json();
	const unified = await unifiedRes.json();

	return {
		questionCategories: questions.questionCategories,
		phaseMitigations: phaseMitigations.phaseMitigations,
		subdomains: subdomains.riskSubdomains,
		domains: domains.riskDomains,
		modelTypeRelevance: unified.modelTypeToSubdomainRelevance,
		vulnerabilityMultipliers: unified.vulnerabilityMultipliers
	};
};
