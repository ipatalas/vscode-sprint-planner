import { WorkItemInfo } from '../models/azure-client/workItems';
import { Task } from '../models/task';
import { TaskInfo, UserStoryInfo } from './azure-client';

type ProcessType = typeof import('../utils/config').Configuration.prototype.process;

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
    public static fromWorkItemInfo(workItem: WorkItemInfo, process: ProcessType): TaskInfo {
        const originalEstimation = workItem.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'];
        const remainingWork = workItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'];

        let estimation: number | undefined;

        if (process === 'Scrum') {
            estimation = remainingWork;
        } else if (process === 'Agile' && originalEstimation === remainingWork) {
            estimation = remainingWork;
        }

        return <TaskInfo>{
            id: workItem.id,
            activity: workItem.fields['Microsoft.VSTS.Common.Activity'],
            title: workItem.fields['System.Title'],
            estimation: estimation,
            stackRank: workItem.fields['Microsoft.VSTS.Common.BacklogPriority'] || workItem.fields['Microsoft.VSTS.Common.StackRank'],
            assignee: workItem.fields['System.AssignedTo']?.uniqueName,
            tags: workItem.fields['System.Tags']?.split('; ').map(t => t.trim()) || []
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