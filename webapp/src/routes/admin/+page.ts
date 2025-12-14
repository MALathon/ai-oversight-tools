import { base } from '$app/paths';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [questionsRes, riskConfigsRes, subdomainsRes, domainsRes] = await Promise.all([
		fetch(`${base}/data/assessment-questions.json`),
		fetch(`${base}/data/risk-configurations.json`),
		fetch(`${base}/data/risk-subdomains.json`),
		fetch(`${base}/data/risk-domains.json`)
	]);

	const questions = await questionsRes.json();
	const riskConfigs = await riskConfigsRes.json();
	const subdomains = await subdomainsRes.json();
	const domains = await domainsRes.json();

	return {
		questionCategories: questions.questionCategories,
		riskConfigurations: riskConfigs.configurations,
		subdomains: subdomains.riskSubdomains,
		domains: domains.riskDomains
	};
};
