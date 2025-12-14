import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [questionsRes, phaseMitigationsRes, subdomainsRes, domainsRes] = await Promise.all([
		fetch('/data/assessment-questions.json'),
		fetch('/data/phase-mitigations.json'),
		fetch('/data/risk-subdomains.json'),
		fetch('/data/risk-domains.json')
	]);

	const questions = await questionsRes.json();
	const phaseMitigations = await phaseMitigationsRes.json();
	const subdomains = await subdomainsRes.json();
	const domains = await domainsRes.json();

	return {
		questions,
		phaseMitigations,
		subdomains: subdomains.riskSubdomains,
		domains: domains.riskDomains
	};
};
