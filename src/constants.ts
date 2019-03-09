export const NewLineRegex = /\r?\n/g;

export const UserStoryPrefix = 'US#';
export const UserStoryRegex = /^US#(\d+)/;
export const EndOfUserStoryRegex = /^(---|\s*)$/;

export const TaskPrefixRegex = /^\s*[-*]\s*/;
export const TaskEstimationRegex = /(\s*[,-]\s*(?<estimation>\d+)h?)$/;
export const TaskLinesSplitter = /\r?\n(?!\t)/; // tab in negative look-ahead assertion is for task descriptions which should be indented by a tab

export const Commands = {
	publish: 'sprintplanner.publish'
}