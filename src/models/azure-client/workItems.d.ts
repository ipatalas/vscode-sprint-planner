import { CollectionResult } from './common';

export type WorkItemInfoResult = CollectionResult<WorkItemInfo>

export interface WorkItemInfo {
	id:         number;
	rev:        number;
	fields:     WorkItemFields;
	relations?: Relation[];
	url:        string;
}

export interface WorkItemFields {
	'System.WorkItemType':                        string;
	'System.AreaPath':                            string;
	'System.TeamProject':                         string;
	'System.IterationPath':                       string;
	'System.Title':                               string;
	'Microsoft.VSTS.Common.StackRank':            number;
	'Microsoft.VSTS.Common.BacklogPriority':      number;
    'Microsoft.VSTS.Common.Activity':             string;
    'Microsoft.VSTS.Scheduling.RemainingWork':    number;
    'Microsoft.VSTS.Scheduling.OriginalEstimate': number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}

export interface Relation {
	rel:        string;
	url:        string;
	attributes: Attributes;
}

export interface Attributes {
	isLocked: boolean;
}
