export interface Task {
	id?: number;
	title: string;
	estimation?: number;
	description?: string[];
	activity?: string;
	line: number;
    stackRank?: number;
}

export interface UserStory {
	line: number;
	id?: number;
	title: string;
	tasks: Task[];
}

export interface IterationTextLine {
	line: number,
	id: string
}