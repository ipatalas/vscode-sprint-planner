export interface Task {
	id?: number;
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