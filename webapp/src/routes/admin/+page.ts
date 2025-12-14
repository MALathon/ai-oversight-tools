import { base } from '$app/paths';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [questionsRes, traceabilityRes, subdomainsRes, domainsRes, mitigationsRes, regulationsRes] = await Promise.all([
		fetch(`${base}/data/assessment-questions.json`),
		fetch(`${base}/data/traceability.json`),
		fetch(`${base}/data/risk-subdomains.json`),
		fetch(`${base}/data/risk-domains.json`),
		fetch(`${base}/data/mitigation-strategies.json`),
		fetch(`${base}/data/cfr-regulations.json`)
	]);

	const questions = await questionsRes.json();
	const traceability = await traceabilityRes.json();
	const subdomains = await subdomainsRes.json();
	const domains = await domainsRes.json();
	const mitigations = await mitigationsRes.json();
	const regulations = await regulationsRes.json();

	return {
		questionCategories: questions.questionCategories,
		traceability: traceability,
		subdomains: subdomains.riskSubdomains,
		domains: domains.riskDomains,
		mitigationCategories: mitigations.mitigationCategories,
		regulations: regulations.regulations
	};
};
