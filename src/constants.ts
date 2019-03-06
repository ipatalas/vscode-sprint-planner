export const UserStoryPrefix = 'US#';
export const UserStoryRegex = /^US#(\d+)/;
export const EndOfUserStoryRegex = /^(---|\s*)$/;

export const TaskPrefixRegex = /^\s*[-*]\s*/;
export const TaskEstimationRegex = /(\s*[,-]\s*(?<estimation>\d+)h?)$/;