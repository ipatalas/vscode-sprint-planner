import { CollectionResult } from './common';

export type TagResult = CollectionResult<TagDefinition>

export interface TagDefinition {
    id: string;
    name: string;
    url: string;
}
