public interface {{name}}Service {

    {{#operations}}
    /*
     response: {{response}}
    */
    public {{response}} {{name}}({{request}} request);
    {{/operations}}

}
