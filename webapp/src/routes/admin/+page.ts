import { base } from '$app/paths';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [questionsRes, phaseMitigationsRes, subdomainsRes, domainsRes] = await Promise.all([
		fetch(`${base}/data/assessment-questions.json`),
		fetch(`${base}/data/phase-mitigations.json`),
		fetch(`${base}/data/risk-subdomains.json`),
		fetch(`${base}/data/risk-domains.json`)
	]);

	const questions = await questionsRes.json();
	const phaseMitigationsData = await phaseMitigationsRes.json();
	const subdomains = await subdomainsRes.json();
	const domains = await domainsRes.json();

	return {
		questions,
		phaseMitigations: phaseMitigationsData.phaseMitigations,
		subdomains: subdomains.riskSubdomains,
		domains: domains.riskDomains
	};
};
