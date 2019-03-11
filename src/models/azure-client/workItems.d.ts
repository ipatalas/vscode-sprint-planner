import { CollectionResult } from "./common";

export interface WorkItemInfoResult extends CollectionResult<WorkItemInfo> {}

export interface WorkItemInfo {
	id:         number;
	rev:        number;
	fields:     WorkItemFields;
	relations?: Relation[];
	url:        string;
}

export interface WorkItemFields {
	"System.WorkItemType":             string;
	"System.AreaPath":                 string;
	"System.TeamProject":              string;
	"System.IterationPath":            string;
	"System.Title":                    string;
	"Microsoft.VSTS.Common.StackRank": number;
}

export interface Relation {
	rel:        string;
	url:        string;
	attributes: Attributes;
}

export interface Attributes {
	isLocked: boolean;
}

export interface WorkItemCreatedResponse {
	id:        number;
	rev:       number;
	url:       string;
}
