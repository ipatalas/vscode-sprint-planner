export interface FieldDefinition {
	defaultValue:    null;
	allowedValues:   string[];
	helpText:        string;
	alwaysRequired:  boolean;
	dependentFields: any[];
	referenceName:   string;
	name:            string;
	url:             string;
}
