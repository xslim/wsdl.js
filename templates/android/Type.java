public class {{name}}Type {


{{#properties}}
{{#if comment}}
/**
{{{comment}}}
*/
{{/if}}
private {{type}} {{name}};


public void set{{upperCaseName}}({{type}} {{name}}) {
	this.{{name}} = {{name}};
}

public String get{{upperCaseName}}() {
	return this.{{name}};
}

{{/properties}}

public Object getProperty(int arg0) {
    switch(arg0) {
        {{#each properties}}
	    case {{@index}}:
		return {{this.name}};	
	{{/each}}
	default: break;
    }
    return null;
}

public int getPropertyCount() {
    return {{numberOfProperties}};
}

public void getPropertyInfo(int index, Hashtable arg1, PropertyInfo info) {
    switch(index) {
	{{#each properties}}
	 case {{@index}}:
	    {{#if native}}
	    info.type = PropertyInfo.{{upperCaseType}}_CLASS;
	    {{else}}
	    // complex type: {{type}}
            {{/if}}

	{{/each}}
    }
}

}
