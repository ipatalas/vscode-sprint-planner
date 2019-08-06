import { WorkItemInfo } from "../models/azure-client/workItems";
import { UserStoryInfo } from "./azure-client";

export class UserStoryInfoMapper {
	public static fromWorkItemInfo(workItem: WorkItemInfo) {
		return (<UserStoryInfo>{
			id: workItem.id,
			url: workItem.url,
			title: workItem.fields["System.Title"],
			areaPath: workItem.fields["System.AreaPath"],
			teamProject: workItem.fields["System.TeamProject"],
			iterationPath: workItem.fields["System.IterationPath"],
			taskUrls: (workItem.relations) && workItem.relations.filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward').map(r => r.url) || []
		});
	}
}