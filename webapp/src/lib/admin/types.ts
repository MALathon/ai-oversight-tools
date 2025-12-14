// Admin module types

export interface Phase {
	id: string;
	name: string;
	short: string;
}

export interface Question {
	id: string;
	text: string;
	type: string;
	category: string;
	options: Array<{ value: string; label: string }>;
	showIf?: Record<string, string | string[]>;
}

export interface Risk {
	id: string;
	code: string;
	name: string;
	shortName: string;
	domain: string;
	phaseGuidance: Record<string, string>;
}

export interface Mitigation {
	id: string;
	code: string;
	name: string;
	category: string;
}

export interface Regulation {
	id: string;
	citation: string;
	description: string;
	framework: string;
}

export interface Control {
	id: string;
	name: string;
	description?: string;
	source?: string;
	subcategoryId: string;
	phases: string[];
	techTypes: string[];
}

export interface ControlSubcategory {
	id: string;
	code: string;
	name: string;
	categoryId: string;
}

export interface Link {
	id: string;
	type: 'trigger' | 'mitigation' | 'regulation';
	from: { entity: string; id: string };
	to: { entity: string; id: string };
	phases?: string[];
	reasoning?: string;
}

export interface SelectedNode {
	type: string;
	id: string;
}

export interface SelectedDetails {
	type: string;
	item: Question | Risk | Mitigation | Regulation | Control | null;
	connections: Link[];
}

export interface QuestionDependencies {
	dependsOn: string[];
	dependedBy: string[];
}

export type EntityType = 'questions' | 'risks' | 'regulations' | 'controls';
export type NodeType = 'question' | 'risk' | 'mitigation' | 'regulation' | 'control';
