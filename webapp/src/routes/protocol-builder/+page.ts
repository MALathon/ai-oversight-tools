import { base } from '$app/paths';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [questionsRes, subdomainsRes, domainsRes, unifiedRes, traceabilityRes, mitigationsRes, controlsRes, concernsRes] = await Promise.all([
		fetch(`${base}/data/assessment-questions.json`),
		fetch(`${base}/data/risk-subdomains.json`),
		fetch(`${base}/data/risk-domains.json`),
		fetch(`${base}/data/unified-schema.json`),
		fetch(`${base}/data/traceability.json`),
		fetch(`${base}/data/mitigation-strategies.json`),
		fetch(`${base}/data/technical-controls.json`),
		fetch(`${base}/data/review-concerns.json`)
	]);

	const questions = await questionsRes.json();
	const subdomains = await subdomainsRes.json();
	const domains = await domainsRes.json();
	const unified = await unifiedRes.json();
	const traceability = await traceabilityRes.json();
	const mitigations = await mitigationsRes.json();
	const controls = await controlsRes.json();
	const concerns = await concernsRes.json();

	// Build stageMitigations from subdomains (stageGuidance is now on each subdomain)
	const stageMitigations: Record<string, Record<string, string>> = {};
	for (const subdomain of subdomains.riskSubdomains) {
		if (subdomain.stageGuidance) {
			stageMitigations[subdomain.id] = subdomain.stageGuidance;
		}
	}

	// Flatten strategies from mitigation categories (strategies = subcategories)
	const strategies = mitigations.mitigationCategories.flatMap((cat: any) =>
		cat.strategies.map((s: any) => ({
			...s,
			categoryId: cat.id,
			categoryName: cat.name,
			categoryDescription: cat.description
		}))
	);

	return {
		questionCategories: questions.questionCategories,
		stageMitigations,
		subdomains: subdomains.riskSubdomains,
		domains: domains.riskDomains,
		modelTypeRelevance: unified.modelTypeToSubdomainRelevance,
		vulnerabilityMultipliers: unified.vulnerabilityMultipliers,
		links: traceability.links,
		strategies,
		mitigationCategories: mitigations.mitigationCategories,
		defenseLayerDescriptions: mitigations.defenseLayerDescriptions,
		controls: controls.controls,
		concerns: concerns.concerns
	};
};
