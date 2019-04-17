export const NewLineRegex = /\r?\n/g;

export const IterationPrefix = 'IT#';
export const IterationRegex = /(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}/;

export const UserStoryPrefix = 'US#';
export const UserStoryRegex = /^US#(\d+)/;
export const EndOfUserStoryRegex = /^(---|\s*)$/;

export const TaskPrefixRegex = /^\s*[-*]\s*/;
export const TaskEstimationRegex = /(\s*[,-]\s*(?<estimation>\d+)h?)$/;
export const TaskLinesSplitter = /\r?\n(?!\t)/; // tab in negative look-ahead assertion is for task descriptions which should be indented by a tab
export const WorkItemIdFromUrl = /\/workItems\/(\d+)/;

export const Commands = {
	publish: 'sprintplanner.publish'
}