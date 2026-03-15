/**
 * Parse a CFR citation string and return an eCFR.gov URL.
 *
 * Handles patterns like:
 *   "45 CFR 46.111(a)(3)" → https://www.ecfr.gov/current/title-45/section-46.111
 *   "21 CFR 812.38"       → https://www.ecfr.gov/current/title-21/section-812.38
 *   "45 CFR Parts 160/164" → https://www.ecfr.gov/current/title-45/part-164
 *
 * Returns null if the citation cannot be parsed.
 */
export function cfrToUrl(citation: string): string | null {
	// "Parts" pattern: e.g. "45 CFR Parts 160/164"
	const partsMatch = citation.match(/^(\d+)\s+CFR\s+Parts?\s+[\d/,\s]*?(\d+)\s*$/i);
	if (partsMatch) {
		const title = partsMatch[1];
		const lastPart = partsMatch[2];
		return `https://www.ecfr.gov/current/title-${title}/part-${lastPart}`;
	}

	// Section pattern: e.g. "45 CFR 46.111(a)(3)" or "21 CFR 812.38"
	const sectionMatch = citation.match(/^(\d+)\s+CFR\s+(\d+(?:\.\d+)?)/i);
	if (sectionMatch) {
		const title = sectionMatch[1];
		const section = sectionMatch[2]; // strips parentheticals automatically
		return `https://www.ecfr.gov/current/title-${title}/section-${section}`;
	}

	return null;
}
