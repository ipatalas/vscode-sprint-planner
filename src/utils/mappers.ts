import { WorkItemInfo } from '../models/azure-client/workItems';
import { Task } from '../models/task';
import { TaskInfo, UserStoryInfo } from './azure-client';

export class UserStoryInfoMapper {
	public static fromWorkItemInfo(workItem: WorkItemInfo): UserStoryInfo {
		return (<UserStoryInfo>{
			id: workItem.id,
			url: workItem.url,
			title: workItem.fields['System.Title'],
			areaPath: workItem.fields['System.AreaPath'],
			teamProject: workItem.fields['System.TeamProject'],
			iterationPath: workItem.fields['System.IterationPath'],
			taskUrls: (workItem.relations) && workItem.relations.filter(r => r.rel === 'System.LinkTypes.Hierarchy-Forward').map(r => r.url) || []
		});
	}
}

export class TaskInfoMapper {
    public static fromWorkItemInfo(workItem: WorkItemInfo): TaskInfo {
        const originalEstimation = workItem.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'];
        const remainingWork = workItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'];

        return <TaskInfo>{
            id: workItem.id,
            activity: workItem.fields['Microsoft.VSTS.Common.Activity'],
            title: workItem.fields['System.Title'],
            estimation: originalEstimation === remainingWork ? remainingWork : undefined,
            stackRank: workItem.fields['Microsoft.VSTS.Common.BacklogPriority'] || workItem.fields['Microsoft.VSTS.Common.StackRank'],
            assignee: workItem.fields['System.AssignedTo'],
            tags: workItem.fields['System.Tags'].split(';')
        };
    }
}

export class TaskMapper {
    public static fromTaskInfo(task: TaskInfo): Task {
        return <Task>{
            id: task.id,
            title: task.title,
            activity: task.activity,
            description: task.description,
            estimation: task.estimation,
            stackRank: task.stackRank,
            assignee: task.assignee,
            tags: task.tags
        };
    }
}