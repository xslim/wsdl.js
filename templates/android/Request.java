import com.samskivert.mustache.Mustache;

public class {{name}} {


    {{#properties}}
    {{#if comment}}
    /**
    {{{comment}}}
    */
    {{/if}}
    private {{type}} {{name}};
    {{/properties}}

    {{#properties}}
    public void set{{upperCaseName}}({{type}} {{name}}) {
        this.{{name}} = {{name}};
    }

    public {{type}} get{{upperCaseName}}() {
        return this.{{name}};
    }
    {{/properties}}

    public String toSoapXml() {
        StringBuilder template = new StringBuilder();
        {{#properties}}
        {{#if native}}
        template.append("\{{# {{name}} }}");
        template.append("<{{name}}>\{{ {{name}} }}</{{name}}>\n");
        template.append("\{{/ {{name}} }}");
        {{else}}
        if({{name}} != null) {
            template.append("<{{name}}>\n");
            template.append({{name}}.toSoapXml() + "\n");
            template.append("</{{name}}>\n");
        }
        {{/if}}
        {{/properties}}

        return Mustache.compiler().compile(template.toString()).execute(this);
    }

}
