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
}
