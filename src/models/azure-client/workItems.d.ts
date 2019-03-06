import { CollectionResult } from "./common";

export interface WorkItemInfoResult extends CollectionResult<WorkItemInfo> {}

export interface WorkItemInfo {
	id:     number;
	rev:    number;
	fields: WorkItemFields;
	url:    string;
}

export interface WorkItemFields {
	"System.AreaPath":      string;
	"System.TeamProject":   string;
	"System.IterationPath": string;
	"System.Title":         string;
}
