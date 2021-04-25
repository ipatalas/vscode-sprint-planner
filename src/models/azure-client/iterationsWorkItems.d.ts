export interface IterationWorkItemsResult {
	workItemRelations: WorkItemRelation[];
	url:               string;
	_links:            Links;
}

export interface Links {
	self:          Project;
	project:       Project;
	team:          Project;
	teamIteration: Project;
}

export interface Project {
	href: string;
}

export interface WorkItemRelation {
	rel:    Rel | null;
	source: Target | null;
	target: Target;
}

export enum Rel {
	SystemLinkTypesHierarchyForward = 'System.LinkTypes.Hierarchy-Forward',
}

export interface Target {
	id:  number;
	url: string;
}