import { CollectionResult } from './common';

export type TeamResult = CollectionResult<TeamDefinition>

export interface TeamDefinition {
    id: string;
    name: string;
    projectId: string;
}

export type TeamMemberResult = CollectionResult<TeamMemberDefinition>

export interface TeamMemberDefinition {
    identity: {
        displayName: string;
        uniqueName: string;
        id: string;
    };
}
