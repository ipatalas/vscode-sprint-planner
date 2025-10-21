export const LanguageId = 'planner';

export const NewLineRegex = /\r?\n/g;
export const ActivityTypeTriggerRegex = /^[a-z]*$/i;
export const SnippetTriggerRegex = /^[a-z]*$/i;
export const ActivityTypeLine = /^[a-z]+:$/i;

export const AreaPrefix = 'Area: ';

export const IterationPrefix = 'IT#';
export const IterationRegex = /^IT#([\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12})/i;

export const UserStoryPrefix = 'US#';
export const UserStoryRegex = /^US#(?<id>\d+|new)( - (?<title>.*))?/;
export const EndOfUserStoryRegex = /^(---|\s*)$/;

export const TaskPrefixRegex = /^\s*[-*]\s*/;
export const TaskEstimationRegex = /\s*,\s*((?<estimation_m>\d+)m|(?<estimation>\d+(?:\.\d+)?)h?)/;
export const TaskAssigneeRegex = /\s*,?\s*@(?<assignee>(\S+))/;
export const TaskTagsRegex = /\s*#(?<tags>(\S+))/g;
export const TaskIdRegex = /\s*\[#(?<id>\d+)\]$/;
export const TaskDescriptionRegex = /^\t/;
export const WorkItemIdFromUrl = /\/workItems\/(\d+)/;

export const Commands = {
    publish: 'sprintplanner.publish',
    syncTasks: 'sprintplanner.syncTasks'
};

export const Diagnostics = {
    InvalidActivity: 'invalid-activity',
    InvalidArea: 'invalid-area'
};