export interface Task {
	title: string;
	estimation?: number;
	description?: string[];
	activity?: string;
	line: number;
}

export interface UserStory {
	line: number,
	id: number,
	tasks: Task[]
}