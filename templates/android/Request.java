
public class {{name}} {

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


public String toSoapXml {
    NSString *tpl = ADYStringMultiline(
<{{namespace}}{{rootName}}>
{{#properties}}
  {{#if native}}
  \{{# {{name}} }}<{{namespace}}{{name}}>\{{ {{name}} }}</{{namespace}}{{name}}>\{{/ {{name}} }}
  {{else}}
  \{{# {{name}} }}
  <{{namespace}}{{name}}>
  \{{ {{name}}.toSoapXml() }}
  </{{namespace}}{{name}}>
  \{{/ {{name}} }}
  {{/if}}
{{/properties}}
</{{namespace}}{{rootName}}>
    );
    NSString *xml = [ADYTemplate renderObject:self fromString:tpl];
    return xml;
}


}
