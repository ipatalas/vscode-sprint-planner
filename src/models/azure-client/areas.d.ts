export interface AreaDefinition {
    id:            string;
    identifier:    string;
    name:          string;
    structureType: string;
    hasChildren:   boolean;
    children:      AreaDefinition[];
    path:          string;
    url:           string;
}
