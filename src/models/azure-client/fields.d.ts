export interface FieldDefinition {
	defaultValue:    null;
	allowedValues:   string[];
	helpText:        string;
	alwaysRequired:  boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	dependentFields: any[];
	referenceName:   string;
	name:            string;
	url:             string;
}
