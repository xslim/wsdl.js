public class {{name}} implements KvmSerializable {

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

    public String get{{upperCaseName}}() {
        return this.{{name}};
    }

    {{/properties}}
}
